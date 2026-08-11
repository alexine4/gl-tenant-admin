export type DocumentStatus = "Pending" | "Ingested" | "Failed";

export interface TenantDocument {
  document_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadResult {
  file_name: string;
  accepted: boolean;
  error?: string;
  document?: TenantDocument;
}

export async function readJsonOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body?.error === "string" ? body.error : "Request failed";
    throw new Error(message);
  }
  return body;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
