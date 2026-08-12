"use client";

import { useRouter } from "next/navigation";
import { use, useState, type SubmitEvent } from "react";
import {
  useChangePasswordMutation,
  useToggleUserStatusMutation,
  useUpdateUserMutation,
  useUserQuery,
} from "@/lib/queries/users";
import type { ManagedRole } from "@/lib/tenant-users-client";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Muted } from "@/components/ui/Muted";
import { useAppDispatch } from "@/store/hooks";
import { pushToast } from "@/store/uiSlice";

const ROLE_OPTIONS = [
  { value: "TenantOperator", label: "TenantOperator" },
  { value: "TenantMember", label: "TenantMember" },
];

export default function UserDetailPage({ params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = use(params);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data: tenantUser, error: loadError } = useUserQuery(user_id);
  const updateUser = useUpdateUserMutation(user_id);
  const changePassword = useChangePasswordMutation(user_id);
  const toggleStatus = useToggleUserStatusMutation(user_id);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ManagedRole>("TenantMember");
  const [newPassword, setNewPassword] = useState("");

  // Reset the profile form whenever a new `tenantUser` object arrives
  // (initial load, or after a save) -- adjusting state during render instead
  // of in an effect avoids an extra cascading render.
  const [profileSyncedWith, setProfileSyncedWith] = useState<typeof tenantUser>(undefined);
  if (tenantUser && tenantUser !== profileSyncedWith) {
    setProfileSyncedWith(tenantUser);
    setEmail(tenantUser.email);
    setDisplayName(tenantUser.display_name);
    setRole(tenantUser.role);
  }

  function handleProfileSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUser.mutate({ email, display_name: displayName, role });
  }

  function handlePasswordSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    changePassword.mutate(newPassword, {
      onSuccess: () => setNewPassword(""),
    });
  }

  function handleToggleStatus() {
    if (!tenantUser) return;
    const action = tenantUser.status === "Active" ? "deactivate" : "reactivate";
    toggleStatus.mutate(action, {
      onSuccess: () => dispatch(pushToast({ tone: "success", message: `User ${action}d.` })),
    });
  }

  if (loadError) {
    return <Alert variant="error">{loadError instanceof Error ? loadError.message : "Failed to load user"}</Alert>;
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

        {updateUser.isError && (
          <Alert variant="error">
            {updateUser.error instanceof Error ? updateUser.error.message : "Failed to save changes"}
          </Alert>
        )}
        {updateUser.isSuccess && <Alert variant="success">Saved.</Alert>}

        <Button type="submit" disabled={updateUser.isPending} className="self-start">
          {updateUser.isPending ? "Saving…" : "Save changes"}
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
        {changePassword.isError && (
          <Alert variant="error">
            {changePassword.error instanceof Error ? changePassword.error.message : "Failed to change password"}
          </Alert>
        )}
        {changePassword.isSuccess && <Alert variant="success">Password updated.</Alert>}
        <Button type="submit" variant="secondary" disabled={changePassword.isPending} className="self-start">
          {changePassword.isPending ? "Updating…" : "Update password"}
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
        {toggleStatus.isError && (
          <div className="mt-2">
            <Alert variant="error">
              {toggleStatus.error instanceof Error ? toggleStatus.error.message : "Failed to update status"}
            </Alert>
          </div>
        )}
        <Button
          variant={tenantUser.status === "Active" ? "danger" : "success"}
          disabled={toggleStatus.isPending}
          className="mt-3"
          onClick={handleToggleStatus}
        >
          {toggleStatus.isPending ? "Updating…" : tenantUser.status === "Active" ? "Deactivate" : "Reactivate"}
        </Button>
      </div>
    </div>
  );
}
