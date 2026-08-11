"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { useAuth } from "@/lib/auth-client";
import { readJsonOrThrow, type ManagedRole } from "@/lib/tenant-users-client";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

const ROLE_OPTIONS = [
  { value: "TenantOperator", label: "TenantOperator" },
  { value: "TenantMember", label: "TenantMember" },
];

export default function NewUserPage() {
  const { authFetch } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ManagedRole>("TenantMember");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authFetch("/tenant/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, display_name: displayName, role, password }),
      });
      await readJsonOrThrow(res);
      router.push("/console/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
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

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create user"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/console/users")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
