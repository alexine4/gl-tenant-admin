import type { Document } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Knowledge-base ingestion accepts structured/text-ish content, not arbitrary
// binaries. Browsers are inconsistent about the MIME type they report for
// some of these (a .md file frequently comes through as "" or
// "application/octet-stream" depending on OS), so we also accept a known
// extension as a fallback when the browser didn't give us a useful type.
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "html",
  "htm",
  "json",
  "pdf",
  "docx",
]);

export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function validateDocumentFile(file: File): string | null {
  if (file.size <= 0) {
    return "File is empty";
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max is ${
      MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)
    } MB`;
  }
  const typeOk = ALLOWED_DOCUMENT_MIME_TYPES.has(file.type);
  const extensionOk = ALLOWED_DOCUMENT_EXTENSIONS.has(extensionOf(file.name));
  if (!typeOk && !extensionOk) {
    return `Unsupported file type "${file.type || extensionOf(file.name) || "unknown"}"`;
  }
  return null;
}

export function serializeDocument(doc: Document) {
  return {
    document_id: doc.id,
    file_name: doc.fileName,
    mime_type: doc.mimeType,
    size_bytes: doc.sizeBytes,
    status: doc.status,
    failure_reason: doc.failureReason,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };
}

const SIMULATED_INGESTION_DELAY_MS = 2500;
// A recognizable marker so ingestion failure is reproducible in tests and
// demos instead of relying on randomness. There is no real ingestion
// pipeline wired up in this codebase yet -- this setTimeout stands in for
// whatever worker/queue eventually consumes "Pending" documents.
const FAILURE_TRIGGER = Buffer.from("FORCE_FAIL");

export function queueIngestion(documentId: string, content: Buffer): void {
  setTimeout(() => {
    const shouldFail = content.includes(FAILURE_TRIGGER);
    prisma.document
      .update({
        where: { id: documentId },
        data: shouldFail
          ? { status: "Failed", failureReason: "Ingestion pipeline rejected the document content" }
          : { status: "Ingested", failureReason: null },
      })
      .catch(() => {
        // Best-effort simulation -- a real worker would have its own
        // retry/dead-letter handling here.
      });
  }, SIMULATED_INGESTION_DELAY_MS);
}
