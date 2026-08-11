"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth-client";
import {
  formatBytes,
  readJsonOrThrow,
  type TenantDocument,
  type UploadResult,
} from "@/lib/documents-client";

const STATUS_STYLES: Record<TenantDocument["status"], string> = {
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Ingested: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
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
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFilesSelected}
          disabled={uploading}
          className="block text-sm text-zinc-700 dark:text-zinc-300"
        />
        {uploading && <p className="mt-1 text-xs text-zinc-500">Uploading…</p>}
        {uploadError && (
          <p className="mt-2 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {uploadError}
          </p>
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

      {loadError && (
        <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {loadError}
        </p>
      )}

      {!documents && !loadError && <p className="text-sm text-zinc-500">Loading…</p>}

      {documents && documents.length === 0 && (
        <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
      )}

      {documents && documents.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-left text-zinc-500 dark:text-zinc-400">
              <th className="py-2 pr-4 font-medium">File</th>
              <th className="py-2 pr-4 font-medium">Size</th>
              <th className="py-2 pr-4 font-medium">Uploaded</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.document_id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-50">{doc.file_name}</td>
                <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{formatBytes(doc.size_bytes)}</td>
                <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">
                  {new Date(doc.created_at).toLocaleString()}
                </td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
                    {doc.status}
                  </span>
                  {doc.status === "Failed" && doc.failure_reason && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{doc.failure_reason}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
