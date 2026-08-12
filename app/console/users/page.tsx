"use client";

import Link from "next/link";
import { useUsersQuery } from "@/lib/queries/users";
import { buttonClasses } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Muted } from "@/components/ui/Muted";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";

export default function UsersDirectoryPage() {
  const { data: users, error } = useUsersQuery();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Users</h1>
        <Link href="/console/users/new" className={buttonClasses("primary")}>
          New user
        </Link>
      </div>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error instanceof Error ? error.message : "Failed to load users"}</Alert>
        </div>
      )}

      {!users && !error && (
        <div className="mt-4">
          <Muted>Loading…</Muted>
        </div>
      )}

      {users && users.length === 0 && (
        <div className="mt-4">
          <Muted>No operators or members yet. Create one with &ldquo;New user&rdquo;.</Muted>
        </div>
      )}

      {users && users.length > 0 && (
        <div className="mt-4">
          <DataTable
            rows={users}
            rowKey={(u) => u.user_id}
            columns={[
              {
                header: "Email",
                cell: (u) => (
                  <Link href={`/console/users/${u.user_id}`} className="text-zinc-900 dark:text-zinc-50 hover:underline">
                    {u.email}
                  </Link>
                ),
              },
              { header: "Display name", cell: (u) => u.display_name, className: "text-zinc-700 dark:text-zinc-300" },
              { header: "Role", cell: (u) => u.role, className: "text-zinc-700 dark:text-zinc-300" },
              {
                header: "Status",
                cell: (u) => <Badge tone={u.status === "Active" ? "positive" : "neutral"}>{u.status}</Badge>,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
