// @ts-nocheck
import { h, Alert, Badge, Card, DataTable, FileField, Muted, TableToggle } from "./ds";

const DOCS = [
  { id: "1", file: "doc-good.txt", size: "68 B", uploaded: "11.08.2026, 12:24", status: "Ingested" },
  { id: "2", file: "doc-fail.txt", size: "65 B", uploaded: "11.08.2026, 12:24", status: "Failed" },
  { id: "3", file: "pricing-faq.md", size: "3.1 KB", uploaded: "10.08.2026, 09:02", status: "Ingested" },
  { id: "4", file: "legacy-terms.docx", size: "44 KB", uploaded: "09.08.2026, 17:40", status: "Processing" },
];

const DOC_TONE = { Ingested: "positive", Failed: "negative", Processing: "warning" };

const RECENT_FAILURES = [
  { id: "2", file: "doc-fail.txt", reason: "Ingestion pipeline rejected the document content" },
];

export function Documents() {
  return h(
    "div",
    { className: "flex flex-col gap-6 max-w-4xl" },
    h(
      "div",
      null,
      h("h1", { className: "text-2xl font-semibold text-zinc-900 dark:text-zinc-50" }, "Knowledge base"),
      h(
        "p",
        { className: "mt-1 text-sm text-zinc-500 dark:text-zinc-400" },
        "Upload documents to feed your tenant's knowledge base. Accepted: TXT, Markdown, CSV, HTML, JSON, PDF, DOCX (up to 20 MB each)."
      )
    ),

    h(
      Card,
      null,
      h(FileField, { multiple: true, accept: ".txt,.md,.csv,.html,.json,.pdf,.docx" }),
      h(Muted, { size: "xs", className: "mt-2" }, "Files are queued and processed asynchronously.")
    ),

    h(
      Card,
      { title: "Documents" },
      h(DataTable, {
        rows: DOCS,
        rowKey: (d) => d.id,
        columns: [
          { header: "File", cell: (d) => d.file },
          { header: "Size", cell: (d) => d.size },
          { header: "Uploaded", cell: (d) => d.uploaded },
          {
            header: "Status",
            cell: (d) => h(Badge, { tone: DOC_TONE[d.status] }, d.status),
          },
        ],
      }),
      h(Alert, { variant: "error", size: "sm" }, "doc-fail.txt: Ingestion pipeline rejected the document content."),
      h(TableToggle, {
        rows: RECENT_FAILURES,
        rowKey: (r) => r.id,
        columns: [
          { header: "File", cell: (r) => r.file },
          { header: "Reason", cell: (r) => r.reason },
        ],
      })
    )
  );
}
