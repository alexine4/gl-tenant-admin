// @ts-nocheck
import { h, Alert, Badge, Button, Card, DataTable, Muted, LineChart, StatTile } from "./ds";

const RECENT_DOCS = [
  { id: "1", file: "pricing-faq.md", status: "Ingested" },
  { id: "2", file: "onboarding-guide.pdf", status: "Ingested" },
  { id: "3", file: "legacy-terms.docx", status: "Failed" },
];

const RECENT_USERS = [
  { id: "1", email: "ops@acme.test", role: "TenantOperator" },
  { id: "2", email: "sales@acme.test", role: "TenantMember" },
  { id: "3", email: "new-hire@acme.test", role: "TenantMember" },
];

export function Dashboard() {
  return h(
    "div",
    { className: "flex flex-col gap-6 max-w-5xl" },
    h(
      "div",
      { className: "flex items-start justify-between gap-4" },
      h(
        "div",
        null,
        h("h1", { className: "text-2xl font-semibold text-zinc-900 dark:text-zinc-50" }, "Welcome, Acme Admin"),
        h(
          "p",
          { className: "mt-1 text-sm text-zinc-600 dark:text-zinc-400" },
          h("span", { className: "font-medium" }, "TenantAdmin"),
          " for Acme Inc. -- here's what's happening across your tenant."
        )
      ),
      h(Badge, { tone: "positive" }, "All systems operational")
    ),

    h(
      "div",
      { className: "grid grid-cols-2 gap-4 md:grid-cols-4" },
      h(StatTile, { label: "Visitors engaged", value: 7200 }),
      h(StatTile, { label: "Unanswered questions", value: 1300 }),
      h(StatTile, { label: "Fallback rate", value: 0.153, format: "percent" }),
      h(StatTile, { label: "Answers this period", value: 6200 })
    ),

    h(
      Card,
      { title: "Conversations & questions (last 30 days)" },
      h(LineChart, {
        categories: ["07-16", "07-23", "07-30", "08-06", "08-14"],
        series: [
          { label: "Conversations", color: "var(--viz-series-1)", values: [420, 480, 512, 470, 560] },
          { label: "Questions", color: "var(--viz-series-2)", values: [610, 900, 700, 640, 590] },
        ],
      })
    ),

    h(
      "div",
      { className: "grid grid-cols-1 gap-4 md:grid-cols-2" },
      h(
        Card,
        { title: "Recent knowledge base uploads" },
        h(DataTable, {
          density: "compact",
          hoverable: false,
          rows: RECENT_DOCS,
          rowKey: (r) => r.id,
          columns: [
            { header: "File", cell: (r) => r.file },
            {
              header: "Status",
              cell: (r) => h(Badge, { tone: r.status === "Ingested" ? "positive" : "negative" }, r.status),
            },
          ],
        })
      ),
      h(
        Card,
        { title: "Recently added users" },
        h(DataTable, {
          density: "compact",
          hoverable: false,
          rows: RECENT_USERS,
          rowKey: (r) => r.id,
          columns: [
            { header: "Email", cell: (r) => r.email },
            { header: "Role", cell: (r) => r.role },
          ],
        })
      )
    ),

    h(
      Card,
      { title: "Quick actions" },
      h(
        "div",
        { className: "flex flex-wrap items-center gap-3" },
        h(Button, { variant: "primary" }, "Invite user"),
        h(Button, { variant: "secondary" }, "Upload document"),
        h(Button, { variant: "link" }, "See full analytics →")
      )
    ),

    h(Alert, { variant: "error", size: "sm" }, "2 documents failed ingestion this week -- review the Knowledge base."),
    h(Muted, { size: "xs" }, "Data refreshes every 15 minutes.")
  );
}
