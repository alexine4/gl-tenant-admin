"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "@/lib/auth-client";
import { readJsonOrThrow, type ManagedRole, type TenantUser } from "@/lib/tenant-users-client";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Muted } from "@/components/ui/Muted";

const ROLE_OPTIONS = [
  { value: "TenantOperator", label: "TenantOperator" },
  { value: "TenantMember", label: "TenantMember" },
];

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
    return <Alert variant="error">{loadError}</Alert>;
  }

  if (!tenantUser) {
    return <Muted>Loading…</Muted>;
  }

  return (
    <div className="max-w-md">
      <Button variant="link" className="mb-4" onClick={() => router.push("/console/users")}>
        &larr; Back to users
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tenantUser.display_name}</h1>
        <Badge tone={tenantUser.status === "Active" ? "positive" : "neutral"}>{tenantUser.status}</Badge>
      </div>

      <form onSubmit={handleProfileSubmit} className="mt-6 flex flex-col gap-4">
        <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <TextField
          label="Display name"
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <SelectField
          label="Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value as ManagedRole)}
        />

        {profileError && <Alert variant="error">{profileError}</Alert>}
        {profileSaved && <Alert variant="success">Saved.</Alert>}

        <Button type="submit" disabled={savingProfile} className="self-start">
          {savingProfile ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <hr className="my-8 border-black/10 dark:border-white/10" />

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Change password</h2>
        <TextField
          type="password"
          required
          minLength={8}
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {passwordError && <Alert variant="error">{passwordError}</Alert>}
        {passwordChanged && <Alert variant="success">Password updated.</Alert>}
        <Button type="submit" variant="secondary" disabled={changingPassword} className="self-start">
          {changingPassword ? "Updating…" : "Update password"}
        </Button>
      </form>

      <hr className="my-8 border-black/10 dark:border-white/10" />

      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {tenantUser.status === "Active" ? "Deactivate this user" : "Reactivate this user"}
        </h2>
        <Muted className="mt-1">
          There is no delete -- deactivating keeps the account and its history intact while blocking login.
        </Muted>
        {statusError && (
          <div className="mt-2">
            <Alert variant="error">{statusError}</Alert>
          </div>
        )}
        <Button
          variant={tenantUser.status === "Active" ? "danger" : "success"}
          disabled={togglingStatus}
          className="mt-3"
          onClick={handleToggleStatus}
        >
          {togglingStatus ? "Updating…" : tenantUser.status === "Active" ? "Deactivate" : "Reactivate"}
        </Button>
      </div>
    </div>
  );
}
