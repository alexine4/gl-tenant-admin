export interface TenantBranding {
  logo_url: string | null;
  logo_mime_type: string | null;
  logo_size_bytes: number | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  updated_at: string;
}

export async function readJsonOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof body?.error === "string" ? body.error : "Request failed";
    throw new Error(message);
  }
  return body;
}
