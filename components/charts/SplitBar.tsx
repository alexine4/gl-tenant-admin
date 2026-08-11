export interface SplitSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * Part-to-whole for exactly two categories: one stacked bar with a legend.
 * Two series always gets a legend (the dependable identity channel) rather
 * than relying on the reader to color-match the segments.
 */
export function SplitBar({ segments }: { segments: [SplitSegment, SplitSegment] }) {
  const total = segments[0].value + segments[1].value || 1;

  return (
    <div className="viz-root">
      <div className="flex h-6 w-full overflow-hidden rounded" style={{ background: "var(--viz-grid)" }}>
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.label}
              className="h-full"
              style={{
                width: `${pct}%`,
                background: s.color,
                marginLeft: i === 1 ? "2px" : undefined,
              }}
              title={`${s.label}: ${Math.round(pct)}%`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex gap-4 text-xs" style={{ color: "var(--viz-text-secondary)" }}>
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label} · <span className="font-medium tabular-nums" style={{ color: "var(--viz-text-primary)" }}>{Math.round((s.value / total) * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
