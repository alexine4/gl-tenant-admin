"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import useInputValue from "@hooks/input-value";

export default function LoginPage() {
  const router = useRouter();
  const email = useInputValue();
  const password = useInputValue();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // An already-authenticated visitor opening /login directly is redirected
  // by middleware.ts before this page ever renders.

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("credentials", { email: email.value, password: password.value, redirect: false });
      if (result?.error) {
        throw new Error("invalid credentials");
      }
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
           {...email}
            placeholder="you@company.com"
          />

          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
           {...password}
            placeholder="••••••••"
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
