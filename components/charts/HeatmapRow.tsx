"use client";

import { useState } from "react";

const SEQ_STEPS = [
  "var(--viz-seq-250)",
  "var(--viz-seq-350)",
  "var(--viz-seq-450)",
  "var(--viz-seq-550)",
  "var(--viz-seq-650)",
];

/** A row of cells for an ordinal axis (hour of day), sequential-hue magnitude. */
export function HeatmapRow({
  data,
  labelFor = (i) => String(i),
}: {
  data: number[];
  labelFor?: (index: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data);

  return (
    <div className="viz-root relative">
      <div className="flex gap-0.5">
        {data.map((value, i) => {
          const bucket = Math.min(SEQ_STEPS.length - 1, Math.floor((value / max) * SEQ_STEPS.length));
          return (
            <div
              key={i}
              className="h-8 flex-1 cursor-default rounded-[2px] transition-[filter]"
              style={{
                background: value === 0 ? "var(--viz-grid)" : SEQ_STEPS[bucket],
                filter: hovered === i ? "brightness(1.2)" : undefined,
              }}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--viz-muted)" }}>
        <span>{labelFor(0)}</span>
        <span>{labelFor(Math.floor(data.length / 2))}</span>
        <span>{labelFor(data.length - 1)}</span>
      </div>
      {hovered !== null && (
        <div
          className="pointer-events-none absolute -top-8 -translate-x-1/2 rounded-md px-2 py-1 text-xs font-medium shadow-md"
          style={{
            left: `${((hovered + 0.5) / data.length) * 100}%`,
            background: "var(--viz-text-primary)",
            color: "var(--viz-surface)",
          }}
        >
          {labelFor(hovered)}: {data[hovered]}
        </div>
      )}
    </div>
  );
}
