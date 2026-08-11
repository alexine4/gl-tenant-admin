"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth-client";
import {
  formatBytes,
  readJsonOrThrow,
  type TenantDocument,
  type UploadResult,
} from "@/lib/documents-client";
import { FileField } from "@/components/ui/FileField";
import { Alert } from "@/components/ui/Alert";
import { Muted } from "@/components/ui/Muted";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";

const STATUS_TONE: Record<TenantDocument["status"], BadgeTone> = {
  Pending: "warning",
  Ingested: "positive",
  Failed: "negative",
};

export default function DocumentsPage() {
  const { authFetch } = useAuth();
  const [documents, setDocuments] = useState<TenantDocument[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await authFetch("/tenant/documents");
      const data = (await readJsonOrThrow(res)) as TenantDocument[];
      setDocuments(data);
      return data;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load documents");
      return null;
    }
  }, [authFetch]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch("/tenant/documents");
        const data = (await readJsonOrThrow(res)) as TenantDocument[];
        if (!cancelled) setDocuments(data);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load documents");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  // Ingestion finishes asynchronously on the server -- poll while anything
  // is still Pending so the status column updates without a manual refresh.
  useEffect(() => {
    if (!documents?.some((d) => d.status === "Pending")) return;
    const interval = setInterval(() => void loadDocuments(), 3000);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploadResults(null);
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      const res = await authFetch("/tenant/documents", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok && !body.results) {
        throw new Error(typeof body.error === "string" ? body.error : "Upload failed");
      }
      setUploadResults(body.results as UploadResult[]);
      await loadDocuments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Knowledge base</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Upload documents to feed your tenant&apos;s knowledge base. Accepted: TXT, Markdown, CSV, HTML, JSON,
        PDF, DOCX (up to 20 MB each).
      </p>

      <div className="mt-6">
        <FileField ref={fileInputRef} multiple onChange={handleFilesSelected} disabled={uploading} />
        {uploading && (
          <Muted size="xs" className="mt-1">
            Uploading…
          </Muted>
        )}
        {uploadError && (
          <div className="mt-2">
            <Alert variant="error">{uploadError}</Alert>
          </div>
        )}
        {uploadResults && (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {uploadResults.map((r, i) => (
              <li key={i} className={r.accepted ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {r.accepted ? "Queued" : "Rejected"}: {r.file_name}
                {!r.accepted && r.error ? ` — ${r.error}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr className="my-6 border-black/10 dark:border-white/10" />

      {loadError && <Alert variant="error">{loadError}</Alert>}

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
