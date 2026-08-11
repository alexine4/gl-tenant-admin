"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type MembershipRole = "TenantAdmin" | "TenantOperator" | "TenantMember";

export interface SessionUser {
  user_id: string;
  email: string;
  display_name: string;
  tenant_id: string;
  role: MembershipRole;
}

interface StoredSession {
  access_token: string;
  refresh_token: string;
  user: SessionUser;
}

type Status = "loading" | "authenticated" | "unauthenticated";

interface Snapshot {
  session: StoredSession | null;
  status: Status;
}

const STORAGE_KEY = "tenant_console_session";
// The access token only lives 60s (see task.md); refresh a bit early so a
// request that lands right at the boundary never rides an expired token.
const REFRESH_LEAD_MS = 10_000;

function decodeExpiryMs(jwt: string): number | null {
  try {
    const payloadB64 = jwt.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadB64)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function readStorage(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStorage(session: StoredSession | null) {
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
}

function goToLogin() {
  // A hard navigation, deliberately: this runs from AuthStore, a plain
  // class outside the React tree, so there's no router instance to call.
  // It also guarantees every in-memory timer and listener from the old
  // session is torn down instead of possibly surviving a client-side route change.
  if (window.location.pathname !== "/login") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
}

const SERVER_SNAPSHOT: Snapshot = { session: null, status: "loading" };

/**
 * Owns the session as a plain external store (not React state) so the
 * refresh timer and the localStorage mirror have exactly one source of
 * truth regardless of how many components render <AuthProvider>. Components
 * subscribe via useSyncExternalStore instead of an effect calling setState,
 * which is also what keeps this hydration-safe (server and the first client
 * render both see SERVER_SNAPSHOT; the real session attaches after mount).
 */
class AuthStore {
  private snapshot: Snapshot = SERVER_SNAPSHOT;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private bootstrapped = false;

  getSnapshot = (): Snapshot => this.snapshot;
  getServerSnapshot = (): Snapshot => SERVER_SNAPSHOT;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    this.bootstrap();
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(next: Snapshot) {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private bootstrap() {
    if (this.bootstrapped) return;
    this.bootstrapped = true;

    const stored = readStorage();
    if (!stored) {
      this.publish({ session: null, status: "unauthenticated" });
      return;
    }

    const expiryMs = decodeExpiryMs(stored.access_token);
    if (expiryMs && expiryMs - REFRESH_LEAD_MS > Date.now()) {
      this.publish({ session: stored, status: "authenticated" });
      this.scheduleRefresh(stored.access_token);
    } else {
      // The tab was reopened after the access token already expired --
      // attempt one refresh immediately instead of forcing a fresh login.
      void this.performRefresh(stored);
    }
  }

  private scheduleRefresh(accessToken: string) {
    this.clearTimer();
    const expiryMs = decodeExpiryMs(accessToken);
    if (!expiryMs) return;
    const delay = Math.max(expiryMs - Date.now() - REFRESH_LEAD_MS, 0);
    this.timer = setTimeout(() => void this.performRefresh(), delay);
  }

  private async performRefresh(seed?: StoredSession) {
    const current = seed ?? this.snapshot.session;
    if (!current) {
      goToLogin();
      return;
    }
    try {
      const res = await fetch("/tenant/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: current.refresh_token }),
      });
      if (!res.ok) throw new Error("refresh rejected");
      const data = (await res.json()) as { access_token: string; refresh_token: string };
      const next: StoredSession = { ...data, user: current.user };
      writeStorage(next);
      this.publish({ session: next, status: "authenticated" });
      this.scheduleRefresh(next.access_token);
    } catch {
      // Covers both cases the spec calls out: an expired refresh token, or
      // the account's password/membership status changing since it was
      // issued (the fingerprint check on the server rejects the refresh).
      this.clearTimer();
      writeStorage(null);
      this.publish({ session: null, status: "unauthenticated" });
      goToLogin();
    }
  }

  async login(email: string, password: string, rememberMe: boolean): Promise<void> {
    const res = await fetch("/tenant/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error ?? "Login failed");
    }
    const next: StoredSession = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      user: body.user,
    };
    writeStorage(next);
    this.publish({ session: next, status: "authenticated" });
    this.scheduleRefresh(next.access_token);
  }

  logout(): void {
    // No server-side effect by design -- fire the request so the endpoint
    // contract is exercised, but the actual logout is discarding locally.
    void fetch("/tenant/auth/logout", { method: "POST" });
    this.clearTimer();
    writeStorage(null);
    this.publish({ session: null, status: "unauthenticated" });
  }

  async authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.snapshot.session) {
      headers.set("Authorization", `Bearer ${this.snapshot.session.access_token}`);
    }
    return fetch(input, { ...init, headers });
  }
}

const authStore = new AuthStore();

interface AuthContextValue {
  user: SessionUser | null;
  status: Status;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
  /** fetch() that attaches the current access token, for calling gated tenant-console endpoints. */
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, status } = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getServerSnapshot
  );

  const login = useCallback(
    (email: string, password: string, rememberMe: boolean) => authStore.login(email, password, rememberMe),
    []
  );
  const logout = useCallback(() => authStore.logout(), []);
  const authFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => authStore.authFetch(input, init),
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, status, login, logout, authFetch }),
    [session, status, login, logout, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
