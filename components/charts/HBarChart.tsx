"use client";

import { useState } from "react";

export interface HBarDatum {
  label: string;
  value: number;
  color?: string;
}

/**
 * Horizontal bar ranking. Each bar is directly labeled with its own
 * category name and value at the tip, so identity never depends on color
 * alone -- a separate legend would just repeat the axis labels.
 */
export function HBarChart({
  data,
  formatValue = (v) => String(Math.round(v)),
  defaultColor = "var(--viz-seq-450)",
}: {
  data: HBarDatum[];
  formatValue?: (value: number) => string;
  defaultColor?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="viz-root flex flex-col gap-2">
      {data.map((d, i) => {
        const widthPct = (d.value / max) * 100;
        const isHovered = hovered === i;
        return (
          <div
            key={d.label}
            className="flex items-center gap-3"
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
          >
            <span
              className="w-32 shrink-0 truncate text-xs"
              style={{ color: "var(--viz-text-secondary)" }}
              title={d.label}
            >
              {d.label}
            </span>
            <div className="relative h-6 flex-1 rounded" style={{ background: "var(--viz-grid)" }}>
              <div
                className="h-6 rounded-[4px] transition-[filter]"
                style={{
                  width: `${Math.max(widthPct, 2)}%`,
                  background: d.color ?? defaultColor,
                  filter: isHovered ? "brightness(1.15)" : undefined,
                }}
              />
            </div>
            <span
              className="w-16 shrink-0 text-right text-xs font-medium tabular-nums"
              style={{ color: "var(--viz-text-primary)" }}
            >
              {formatValue(d.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
