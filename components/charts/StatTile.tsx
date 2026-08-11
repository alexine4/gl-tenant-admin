function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

export function StatTile({
  label,
  value,
  format = "number",
}: {
  label: string;
  value: number;
  format?: "number" | "percent" | "currency";
}) {
  const display =
    format === "percent"
      ? `${(value * 100).toFixed(1)}%`
      : format === "currency"
        ? `$${value.toFixed(3)}`
        : formatCompact(value);

  return (
    <div className="viz-root rounded-lg border border-black/10 dark:border-white/10 p-4" style={{ background: "var(--viz-surface)" }}>
      <p className="text-xs font-medium" style={{ color: "var(--viz-text-secondary)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--viz-text-primary)" }}>
        {display}
      </p>
    </div>
  );
}
