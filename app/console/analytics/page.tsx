"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { DAY_NAMES, readJsonOrThrow, type AnalyticsResponse } from "@/lib/analytics-client";
import { StatTile } from "@/components/charts/StatTile";
import { LineChart } from "@/components/charts/LineChart";
import { HBarChart } from "@/components/charts/HBarChart";
import { SplitBar } from "@/components/charts/SplitBar";
import { HeatmapRow } from "@/components/charts/HeatmapRow";
import { TableToggle } from "@/components/charts/TableToggle";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";
import { Muted } from "@/components/ui/Muted";
import { DataTable } from "@/components/ui/DataTable";

const LAYER_COLORS: Record<string, string> = {
  KnowledgeBase: "var(--viz-series-1)",
  FAQ: "var(--viz-series-2)",
  LLM: "var(--viz-series-3)",
  Fallback: "var(--viz-series-4)",
};

const FUNNEL_COLORS = [
  "var(--viz-seq-250)",
  "var(--viz-seq-350)",
  "var(--viz-seq-450)",
  "var(--viz-seq-550)",
  "var(--viz-seq-650)",
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "Last 7 days", from: () => isoDaysAgo(6), to: () => isoDaysAgo(0) },
  { label: "Last 30 days", from: () => isoDaysAgo(29), to: () => isoDaysAgo(0) },
  { label: "Last 90 days", from: () => isoDaysAgo(89), to: () => isoDaysAgo(0) },
];

export default function AnalyticsPage() {
  const { authFetch } = useAuth();
  const [from, setFrom] = useState(isoDaysAgo(29));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch(`/tenant/analytics?from=${from}&to=${to}`);
        const body = (await readJsonOrThrow(res)) as AnalyticsResponse;
        // Refetch keeps the previous render until the new data is ready --
        // no intermediate null flash while switching date ranges.
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load analytics");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authFetch, from, to]);

  const handleExport = useCallback(
    async (format: "csv" | "json") => {
      setExporting(format);
      try {
        const res = await authFetch(`/tenant/analytics/export?from=${from}&to=${to}&format=${format}`);
        if (!res.ok) throw new Error("Export failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-${from}_to_${to}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export failed");
      } finally {
        setExporting(null);
      }
    },
    [authFetch, from, to]
  );

  const dowData = useMemo(
    () => data?.day_of_week.map((d) => ({ label: DAY_NAMES[d.day], value: d.count })) ?? [],
    [data]
  );

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Analytics</h1>

      {/* Filters: one row, date range first, above every chart -- every
          section below scopes to the same from/to so numbers always agree. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="secondary"
            size="sm"
            onClick={() => {
              setFrom(p.from());
              setTo(p.to());
            }}
          >
            {p.label}
          </Button>
        ))}
        <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />
        <TextField type="date" size="sm" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-xs text-zinc-500">to</span>
        <TextField type="date" size="sm" value={to} min={from} onChange={(e) => setTo(e.target.value)} />

        <span className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => handleExport("csv")} disabled={exporting !== null}>
            {exporting === "csv" ? "Exporting…" : "Export CSV"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("json")} disabled={exporting !== null}>
            {exporting === "json" ? "Exporting…" : "Export JSON"}
          </Button>
        </span>
      </div>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {!data && !error && (
        <div className="mt-6">
          <Muted>Loading…</Muted>
        </div>
      )}

      {data && (
        <div className="mt-6 flex flex-col gap-6" style={{ opacity: exporting ? 0.7 : 1 }}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Visitors engaged" value={data.visitors_engaged} />
            <StatTile label="Unanswered questions" value={data.unanswered_questions} />
            <StatTile label="Fallback rate" value={data.fallback_rate} format="percent" />
            <StatTile label="Answers this billing period" value={data.current_billing_period.total_answers} />
            <StatTile
              label="Per-answer rate"
              value={data.current_billing_period.per_answer_rate}
              format="currency"
            />
          </div>

          <Card title="Conversations & questions by period">
            <LineChart
              categories={data.conversations_and_questions_by_period.map((d) => d.date)}
              series={[
                {
                  label: "Conversations",
                  color: "var(--viz-series-1)",
                  values: data.conversations_and_questions_by_period.map((d) => d.conversations),
                },
                {
                  label: "Questions",
                  color: "var(--viz-series-2)",
                  values: data.conversations_and_questions_by_period.map((d) => d.questions),
                },
              ]}
            />
            <TableToggle
              rows={data.conversations_and_questions_by_period}
              rowKey={(d) => d.date}
              columns={[
                { header: "Date", cell: (d) => d.date },
                { header: "Conversations", cell: (d) => d.conversations },
                { header: "Questions", cell: (d) => d.questions },
              ]}
            />
          </Card>

          <Card title="Drop-off rate over time">
            <LineChart
              categories={data.drop_off.by_period.map((d) => d.date)}
              series={[
                {
                  label: "Drop-off rate",
                  color: "var(--viz-series-1)",
                  values: data.drop_off.by_period.map((d) => Math.round(d.rate * 1000) / 10),
                },
              ]}
            />
            <TableToggle
              rows={data.drop_off.by_period}
              rowKey={(d) => d.date}
              columns={[
                { header: "Date", cell: (d) => d.date },
                { header: "Drop-off rate", cell: (d) => `${(d.rate * 100).toFixed(1)}%` },
              ]}
            />
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Conversion funnel">
              <HBarChart
                data={data.conversion_funnel.map((f, i) => ({
                  label: f.stage,
                  value: f.count,
                  color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                }))}
              />
            </Card>

            <Card title="Which layer answered">
              <HBarChart
                data={data.answered_by_layer.map((l) => ({
                  label: l.layer,
                  value: l.count,
                  color: LAYER_COLORS[l.layer],
                }))}
              />
            </Card>

            <Card title="Topic engagement">
              <HBarChart data={data.topic_engagement.map((t) => ({ label: t.topic, value: t.engagement_count }))} />
            </Card>

            <Card title="Conversations by day of week">
              <HBarChart data={dowData} />
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Voice / text split">
              <SplitBar
                segments={[
                  { label: "Voice", value: data.voice_text_split.voice, color: "var(--viz-series-1)" },
                  { label: "Text", value: data.voice_text_split.text, color: "var(--viz-series-2)" },
                ]}
              />
            </Card>

            <Card title="New / returning visitors">
              <SplitBar
                segments={[
                  { label: "New", value: data.visitor_split.new, color: "var(--viz-series-1)" },
                  { label: "Returning", value: data.visitor_split.returning, color: "var(--viz-series-2)" },
                ]}
              />
            </Card>
          </div>

          <Card title="Conversations by time of day">
            <HeatmapRow data={data.time_of_day.map((h) => h.count)} labelFor={(i) => `${i}:00`} />
            <TableToggle
              rows={data.time_of_day}
              rowKey={(h) => String(h.hour)}
              columns={[
                { header: "Hour", cell: (h) => `${h.hour}:00` },
                { header: "Conversations", cell: (h) => h.count },
              ]}
            />
          </Card>

          <Card title="Top questions by topic">
            <DataTable
              rows={data.top_questions_by_topic}
              rowKey={(row) => row.topic}
              hoverable={false}
              columns={[
                { header: "Topic", cell: (row) => row.topic, className: "text-zinc-900 dark:text-zinc-50" },
                {
                  header: "Top question",
                  cell: (row) => row.question,
                  className: "text-zinc-600 dark:text-zinc-400",
                },
                {
                  header: "Count",
                  cell: (row) => row.count,
                  className: "tabular-nums text-zinc-900 dark:text-zinc-50",
                },
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
