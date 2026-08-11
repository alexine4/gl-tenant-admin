"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface LineSeries {
  label: string;
  color: string;
  values: number[];
}

const WIDTH = 1000;
const HEIGHT = 260;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

/** Trend-over-time, one shared axis for every series (never dual-axis). */
export function LineChart({
  categories,
  series,
}: {
  /** X-axis labels, one per data point (e.g. ISO dates). */
  categories: string[];
  series: LineSeries[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const n = categories.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) => (n <= 1 ? WIDTH / 2 : (i / (n - 1)) * WIDTH);
  const yFor = (v: number) => PAD_TOP + plotHeight - (v / max) * plotHeight;

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const fraction = (event.clientX - rect.left) / rect.width;
    const index = Math.min(n - 1, Math.max(0, Math.round(fraction * (n - 1))));
    setHovered(index);
  }

  return (
    <div className="viz-root">
      {series.length > 1 && (
        <div className="mb-2 flex gap-4 text-xs" style={{ color: "var(--viz-text-secondary)" }}>
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div
        ref={containerRef}
        className="relative"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
          {[0, 0.5, 1].map((frac) => (
            <line
              key={frac}
              x1={0}
              x2={WIDTH}
              y1={PAD_TOP + plotHeight * frac}
              y2={PAD_TOP + plotHeight * frac}
              stroke="var(--viz-grid)"
              strokeWidth={1}
            />
          ))}

          {series.map((s) => (
            <polyline
              key={s.label}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ")}
            />
          ))}

          {hovered !== null && (
            <line
              x1={xFor(hovered)}
              x2={xFor(hovered)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              stroke="var(--viz-baseline)"
              strokeWidth={1}
            />
          )}

          {hovered !== null &&
            series.map((s) => (
              <circle
                key={s.label}
                cx={xFor(hovered)}
                cy={yFor(s.values[hovered])}
                r={5}
                fill={s.color}
                stroke="var(--viz-surface)"
                strokeWidth={2}
              />
            ))}
        </svg>

        {hovered !== null && (
          <div
            className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-xs shadow-md"
            style={{
              left: `${(xFor(hovered) / WIDTH) * 100}%`,
              background: "var(--viz-text-primary)",
              color: "var(--viz-surface)",
            }}
          >
            <p className="font-medium">{categories[hovered]}</p>
            {series.map((s) => (
              <p key={s.label}>
                <span className="font-semibold">{s.values[hovered]}</span> {s.label}
              </p>
            ))}
          </div>
        )}

        <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--viz-muted)" }}>
          <span>{categories[0]}</span>
          <span>{categories[Math.floor((n - 1) / 2)]}</span>
          <span>{categories[n - 1]}</span>
        </div>
      </div>
    </div>
  );
}
