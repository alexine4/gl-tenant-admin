"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { TextField } from "@/components/ui/TextField";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already have a session (e.g. opened /login directly while logged in) --
  // skip the form.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/console");
    }
  }, [status, router]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, rememberMe);
      router.replace("/console");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sign in to your tenant console
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Use the account credentials issued for your tenant.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <TextField
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />

          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Checkbox label="Remember me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
