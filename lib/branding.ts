import type { TenantBranding } from "@prisma/client";

// Raster formats only. SVG is deliberately excluded: an uploaded .svg is
// served back from our own origin, and a browser that's navigated to an
// SVG URL directly (not just used as an <img> src) will execute any
// <script> embedded in it -- a stored-XSS vector we'd rather not open for
// a field whose whole point is "let the tenant upload a file".
export const ALLOWED_LOGO_MIME_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export interface LogoValidationError {
  error: string;
}

export function validateLogoFile(file: File): LogoValidationError | null {
  if (!(file.type in ALLOWED_LOGO_MIME_TYPES)) {
    return {
      error: `Unsupported logo format "${file.type || "unknown"}". Allowed: PNG, JPEG, WebP, GIF.`,
    };
  }
  if (file.size <= 0) {
    return { error: "Uploaded logo file is empty." };
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return {
      error: `Logo file is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max is ${
        MAX_LOGO_SIZE_BYTES / (1024 * 1024)
      } MB.`,
    };
  }
  return null;
}

export function serializeBranding(branding: TenantBranding) {
  return {
    logo_url: branding.logoUrl,
    logo_mime_type: branding.logoMimeType,
    logo_size_bytes: branding.logoSizeBytes,
    primary_color: branding.primaryColor,
    secondary_color: branding.secondaryColor,
    accent_color: branding.accentColor,
    updated_at: branding.updatedAt.toISOString(),
  };
}
