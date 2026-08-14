"use client";

import { useRef, type ChangeEvent } from "react";
import { useDocumentsQuery, useUploadDocumentsMutation } from "@/lib/queries/documents";
import { formatBytes, type TenantDocument } from "@/lib/documents-client";
import { FileField } from "@/components/ui/FileField";
import { Alert } from "@/components/ui/Alert";
import { Muted } from "@/components/ui/Muted";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { useAppDispatch } from "@/store/hooks";
import { pushToast } from "@/store/uiSlice";

const STATUS_TONE: Record<TenantDocument["status"], BadgeTone> = {
  Pending: "warning",
  Ingested: "positive",
  Failed: "negative",
};

export default function DocumentsPage() {
  const dispatch = useAppDispatch();
  const { data: documents, error: loadError } = useDocumentsQuery();
  const uploadDocuments = useUploadDocumentsMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    uploadDocuments.mutate(files, {
      onSuccess: () => dispatch(pushToast({ tone: "success", message: "Documents queued for ingestion." })),
      onError: (err) =>
        dispatch(pushToast({ tone: "error", message: err instanceof Error ? err.message : "Upload failed" })),
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Knowledge base</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Upload documents to feed your tenant&apos;s knowledge base. Accepted: TXT, Markdown, CSV, HTML, JSON,
        PDF, DOCX (up to 20 MB each).
      </p>

      <div className="mt-6">
        <FileField ref={fileInputRef} multiple onChange={handleFilesSelected} disabled={uploadDocuments.isPending} />
        {uploadDocuments.isPending && (
          <Muted size="xs" className="mt-1">
            Uploading…
          </Muted>
        )}
        {uploadDocuments.isError && (
          <div className="mt-2">
            <Alert variant="error">
              {uploadDocuments.error instanceof Error ? uploadDocuments.error.message : "Upload failed"}
            </Alert>
          </div>
        )}
        {uploadDocuments.data && (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {uploadDocuments.data.map((r, i) => (
              <li key={i} className={r.accepted ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {r.accepted ? "Queued" : "Rejected"}: {r.file_name}
                {!r.accepted && r.error ? ` — ${r.error}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr className="my-6 border-black/10 dark:border-white/10" />

      {loadError && (
        <Alert variant="error">{loadError instanceof Error ? loadError.message : "Failed to load documents"}</Alert>
      )}

      {!documents && !loadError && <Muted>Loading…</Muted>}

      {documents && documents.length === 0 && <Muted>No documents uploaded yet.</Muted>}

      {documents && documents.length > 0 && (
        <DataTable
          rows={documents}
          rowKey={(doc) => doc.document_id}
          columns={[
            { header: "File", cell: (doc) => doc.file_name, className: "text-zinc-900 dark:text-zinc-50" },
            {
              header: "Size",
              cell: (doc) => formatBytes(doc.size_bytes),
              className: "text-zinc-600 dark:text-zinc-400",
            },
            {
              header: "Uploaded",
              cell: (doc) => new Date(doc.created_at).toLocaleString(),
              className: "text-zinc-600 dark:text-zinc-400",
            },
            {
              header: "Status",
              cell: (doc) => (
                <>
                  <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
                  {doc.status === "Failed" && doc.failure_reason && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{doc.failure_reason}</p>
                  )}
                </>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
