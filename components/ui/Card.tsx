import type { ReactNode } from "react";

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
      {title && <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>}
      {children}
    </section>
  );
}
