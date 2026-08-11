"use client";

import { useAuth } from "@/lib/auth-client";

export default function UsersSectionLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role !== "TenantAdmin") {
    return (
      <div className="max-w-lg rounded-md bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        Only a TenantAdmin can manage users in this tenant.
      </div>
    );
  }

  return <>{children}</>;
}
