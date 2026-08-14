// @ts-nocheck
import {
  h,
  Button,
  Card,
  DataTable,
  HBarChart,
  HeatmapRow,
  LineChart,
  Muted,
  SplitBar,
  StatTile,
  TextField,
} from "./ds";

const CATEGORIES = ["2026-07-16", "2026-07-23", "2026-07-30", "2026-08-06", "2026-08-14"];

const TOP_QUESTIONS = [
  { topic: "Billing", question: "How do I update my payment method?", count: 634 },
  { topic: "Onboarding", question: "How do I invite my team?", count: 1008 },
  { topic: "Integrations", question: "Do you support Slack?", count: 2046 },
  { topic: "Troubleshooting", question: "My upload failed, why?", count: 661 },
  { topic: "Pricing", question: "Do you offer annual billing?", count: 2590 },
];

export function Analytics() {
  return h(
    "div",
    { className: "flex flex-col gap-6 max-w-5xl" },
    h(
      "div",
      { className: "flex flex-wrap items-center justify-between gap-4" },
      h("h1", { className: "text-2xl font-semibold text-zinc-900 dark:text-zinc-50" }, "Analytics"),
      h(
        "div",
        { className: "flex items-center gap-2" },
        h(Button, { variant: "primary", size: "sm" }, "Last 7 days"),
        h(Button, { variant: "secondary", size: "sm" }, "Last 30 days"),
        h(Button, { variant: "secondary", size: "sm" }, "Last 90 days"),
        h(TextField, { type: "date", size: "sm", defaultValue: "2026-07-16" }),
        h("span", { className: "text-xs text-zinc-500 dark:text-zinc-400" }, "to"),
        h(TextField, { type: "date", size: "sm", defaultValue: "2026-08-14" }),
        h(Button, { variant: "secondary", size: "sm" }, "Export CSV"),
        h(Button, { variant: "secondary", size: "sm" }, "Export JSON")
      )
    ),

    h(
      "div",
      { className: "grid grid-cols-2 gap-4 md:grid-cols-5" },
      h(StatTile, { label: "Visitors engaged", value: 7200 }),
      h(StatTile, { label: "Unanswered questions", value: 1300 }),
      h(StatTile, { label: "Fallback rate", value: 0.153, format: "percent" }),
      h(StatTile, { label: "Answers this period", value: 6200 }),
      h(StatTile, { label: "Per-answer rate", value: 0.031, format: "currency" })
    ),

    h(
      Card,
      { title: "Conversations & questions by period" },
      h(LineChart, {
        categories: CATEGORIES,
        series: [
          { label: "Conversations", color: "var(--viz-series-1)", values: [312, 348, 410, 296, 402] },
          { label: "Questions", color: "var(--viz-series-2)", values: [601, 902, 616, 573, 588] },
        ],
      })
    ),

    h(
      Card,
      { title: "Drop-off rate over time" },
      h(LineChart, {
        categories: CATEGORIES,
        series: [{ label: "Drop-off", color: "var(--viz-series-3)", values: [0.31, 0.26, 0.34, 0.22, 0.29] }],
      })
    ),

    h(
      "div",
      { className: "grid grid-cols-1 gap-4 md:grid-cols-2" },
      h(
        Card,
        { title: "Conversion funnel" },
        h(HBarChart, {
          data: [
            { label: "Visited", value: 7164 },
            { label: "Engaged", value: 4185 },
            { label: "AskedQuestion", value: 3872 },
            { label: "ReceivedAnswer", value: 3285 },
            { label: "Converted", value: 677 },
          ],
        })
      ),
      h(
        Card,
        { title: "Which layer answered" },
        h(HBarChart, {
          data: [
            { label: "KnowledgeBase", value: 2408, color: "var(--viz-series-1)" },
            { label: "FAQ", value: 943, color: "var(--viz-series-2)" },
            { label: "LLM", value: 2251, color: "var(--viz-series-3)" },
            { label: "Fallback", value: 1667, color: "var(--viz-series-4)" },
          ],
        })
      )
    ),

    h(
      "div",
      { className: "grid grid-cols-1 gap-4 md:grid-cols-2" },
      h(
        Card,
        { title: "Voice / text split" },
        h(SplitBar, {
          segments: [
            { label: "Voice", value: 27, color: "var(--viz-series-1)" },
            { label: "Text", value: 73, color: "var(--viz-series-2)" },
          ],
        })
      ),
      h(
        Card,
        { title: "New / returning visitors" },
        h(SplitBar, {
          segments: [
            { label: "New", value: 50, color: "var(--viz-series-1)" },
            { label: "Returning", value: 50, color: "var(--viz-series-2)" },
          ],
        })
      )
    ),

    h(
      Card,
      { title: "Conversations by time of day" },
      h(HeatmapRow, {
        data: [4, 6, 5, 7, 9, 12, 15, 18, 20, 22, 19, 17, 21, 24, 23, 20, 18, 16, 14, 12, 10, 8, 6, 5],
        labelFor: (i) => `${String(i).padStart(2, "0")}:00`,
      })
    ),

    h(
      Card,
      { title: "Top questions by topic" },
      h(DataTable, {
        rows: TOP_QUESTIONS,
        rowKey: (r) => r.topic,
        columns: [
          { header: "Topic", cell: (r) => r.topic, className: "font-medium" },
          { header: "Top question", cell: (r) => r.question },
          { header: "Count", cell: (r) => r.count, className: "tabular-nums" },
        ],
      })
    ),

    h(Muted, { size: "xs" }, "Figures are illustrative, generated for this design preview.")
  );
}
