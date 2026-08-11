import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { EXTENSION_TO_MIME_TYPE, LOGO_STORAGE_ROOT } from "@/lib/branding";

// Public by design -- logos are meant to be shown across the tenant's own
// (public-facing) experience, the same as any other branding asset. No
// bearer token required to view one.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ tenantId: string; filename: string }> }
) {
  const { tenantId, filename } = await ctx.params;

  // Each dynamic segment is already a single path component (Next.js won't
  // let a raw "/" through), but reject ".." defensively so this can never
  // be walked outside LOGO_STORAGE_ROOT.
  if (tenantId.includes("..") || filename.includes("..")) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = EXTENSION_TO_MIME_TYPE[extension];
  if (!mimeType) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(LOGO_STORAGE_ROOT, tenantId, filename));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeType,
        // Filenames are random UUIDs minted fresh per upload, so the
        // content behind any given URL never changes -- safe to cache hard.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
