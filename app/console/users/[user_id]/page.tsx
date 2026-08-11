"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "@/lib/auth-client";
import { readJsonOrThrow, type ManagedRole, type TenantUser } from "@/lib/tenant-users-client";

export default function UserDetailPage({ params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = use(params);
  const { authFetch } = useAuth();
  const router = useRouter();

  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ManagedRole>("TenantMember");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch(`/tenant/users/${user_id}`);
        const data = (await readJsonOrThrow(res)) as TenantUser;
        if (cancelled) return;
        setTenantUser(data);
        setEmail(data.email);
        setDisplayName(data.display_name);
        setRole(data.role);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load user");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authFetch, user_id]);

  async function handleProfileSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      const res = await authFetch(`/tenant/users/${user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, display_name: displayName, role }),
      });
      const updated = (await readJsonOrThrow(res)) as TenantUser;
      setTenantUser(updated);
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordChanged(false);
    setChangingPassword(true);
    try {
      const res = await authFetch(`/tenant/users/${user_id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to change password");
      }
      setNewPassword("");
      setPasswordChanged(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleToggleStatus() {
    if (!tenantUser) return;
    setStatusError(null);
    setTogglingStatus(true);
    const action = tenantUser.status === "Active" ? "deactivate" : "reactivate";
    try {
      const res = await authFetch(`/tenant/users/${user_id}/${action}`, { method: "POST" });
      const updated = (await readJsonOrThrow(res)) as TenantUser;
      setTenantUser(updated);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  }

  if (loadError) {
    return (
      <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
        {loadError}
      </p>
    );
  }

  if (!tenantUser) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="max-w-md">
      <button
        onClick={() => router.push("/console/users")}
        className="mb-4 text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to users
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tenantUser.display_name}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            tenantUser.status === "Active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {tenantUser.status}
        </span>
      </div>

      <form onSubmit={handleProfileSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Display name
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ManagedRole)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
            <option value="TenantOperator">TenantOperator</option>
            <option value="TenantMember">TenantMember</option>
          </select>
        </label>

        {profileError && (
          <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {profileError}
          </p>
        )}
        {profileSaved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}

        <button
          type="submit"
          disabled={savingProfile}
          className="self-start rounded-full bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
        >
          {savingProfile ? "Saving…" : "Save changes"}
        </button>
      </form>

      <hr className="my-8 border-black/10 dark:border-white/10" />

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Change password</h2>
        <input
          type="password"
          required
          minLength={8}
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        {passwordError && (
          <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {passwordError}
          </p>
        )}
        {passwordChanged && <p className="text-sm text-emerald-600 dark:text-emerald-400">Password updated.</p>}
        <button
          type="submit"
          disabled={changingPassword}
          className="self-start rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {changingPassword ? "Updating…" : "Update password"}
        </button>
      </form>

      <hr className="my-8 border-black/10 dark:border-white/10" />

      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {tenantUser.status === "Active" ? "Deactivate this user" : "Reactivate this user"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          There is no delete -- deactivating keeps the account and its history intact while blocking login.
        </p>
        {statusError && (
          <p className="mt-2 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {statusError}
          </p>
        )}
        <button
          onClick={handleToggleStatus}
          disabled={togglingStatus}
          className={`mt-3 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            tenantUser.status === "Active"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {togglingStatus ? "Updating…" : tenantUser.status === "Active" ? "Deactivate" : "Reactivate"}
        </button>
      </div>
    </div>
  );
}
