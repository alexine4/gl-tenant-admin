"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { readJsonOrThrow, type TenantUser } from "@/lib/tenant-users-client";

export default function UsersDirectoryPage() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState<TenantUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch("/tenant/users");
        const data = (await readJsonOrThrow(res)) as TenantUser[];
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Users</h1>
        <Link
          href="/console/users/new"
          className="rounded-full bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-90"
        >
          New user
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {!users && !error && <p className="mt-4 text-sm text-zinc-500">Loading…</p>}

      {users && users.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          No operators or members yet. Create one with &ldquo;New user&rdquo;.
        </p>
      )}

      {users && users.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-left text-zinc-500 dark:text-zinc-400">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Display name</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.user_id}
                className="border-b border-black/5 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <td className="py-2 pr-4">
                  <Link href={`/console/users/${u.user_id}`} className="text-zinc-900 dark:text-zinc-50 hover:underline">
                    {u.email}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{u.display_name}</td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{u.role}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.status === "Active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
