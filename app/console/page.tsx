import { auth } from "@/auth";

export default async function ConsoleOverviewPage() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Welcome, {user.display_name}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        You are signed in as <strong>{user.role}</strong> for this tenant. Use the navigation to manage
        branding, the knowledge base, analytics{user.role === "TenantAdmin" ? ", and your team" : ""}.
      </p>
    </div>
  );
}
