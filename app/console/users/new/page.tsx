"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { useCreateUserMutation } from "@/lib/queries/users";
import type { ManagedRole } from "@/lib/tenant-users-client";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { pushToast } from "@/store/uiSlice";

const ROLE_OPTIONS = [
  { value: "TenantOperator", label: "TenantOperator" },
  { value: "TenantMember", label: "TenantMember" },
];

export default function NewUserPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const createUser = useCreateUserMutation();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ManagedRole>("TenantMember");
  const [password, setPassword] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    createUser.mutate(
      { email, display_name: displayName, role, password },
      {
        onSuccess: () => {
          dispatch(pushToast({ tone: "success", message: "User created." }));
          router.push("/console/users");
        },
      }
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New user</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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

        <TextField
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {createUser.isError && (
          <Alert variant="error">
            {createUser.error instanceof Error ? createUser.error.message : "Failed to create user"}
          </Alert>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? "Creating…" : "Create user"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/console/users")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
