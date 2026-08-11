"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type MembershipRole } from "@/lib/auth-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Muted } from "@/components/ui/Muted";

const NAV_ITEMS: { href: string; label: string; roles?: MembershipRole[] }[] = [
  { href: "/console", label: "Overview" },
  { href: "/console/branding", label: "Branding" },
  { href: "/console/documents", label: "Knowledge base" },
  { href: "/console/analytics", label: "Analytics" },
  { href: "/console/users", label: "Users", roles: ["TenantAdmin"] },
];

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Muted>Loading session…</Muted>
      </div>
    );
  }

  if (status === "unauthenticated" || !user) {
    // useEffect above is already redirecting; render nothing meanwhile.
    return null;
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <div className="flex flex-1 flex-col md:flex-row bg-zinc-50 dark:bg-black">
      <aside className="flex md:w-56 shrink-0 flex-col border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-4">
        <div className="mb-6">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{user.display_name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
          <span className="mt-1 inline-block">
            <Badge tone="neutral">{user.role}</Badge>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
