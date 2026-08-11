import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { ALLOWED_LOGO_MIME_TYPES, serializeBranding, validateLogoFile } from "@/lib/branding";
import { prisma } from "@/lib/prisma";

// Deliberately not the LOGO_STORAGE_ROOT exported from lib/branding.ts:
// Turbopack's build-time file-tracing analysis only recognizes a
// `path.join(process.cwd(), ...)` root as statically scoped when it's
// declared in the same file as the fs call. Importing it from another
// module falls back to tracing (and bundling) the whole project for this
// route -- confirmed by removing/re-adding the import and diffing the
// `next build` warnings. Keep this literal in sync with lib/branding.ts.
const LOGO_STORAGE_ROOT = path.join(process.cwd(), "storage", "branding");

export const POST = withAuth(async (request, _ctx, auth) => {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("logo");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "logo" file in form data' }, { status: 400 });
  }

  const validationError = validateLogoFile(file);
  if (validationError) {
    return NextResponse.json(validationError, { status: 400 });
  }

  const existing = await prisma.tenantBranding.findUnique({ where: { tenantId: auth.tenant_id } });

  const extension = ALLOWED_LOGO_MIME_TYPES[file.type];
  const fileName = `${randomUUID()}.${extension}`;
  const tenantDir = path.join(LOGO_STORAGE_ROOT, auth.tenant_id);
  await mkdir(tenantDir, { recursive: true });
  const filePath = path.join(tenantDir, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  // Served by app/uploads/branding/[tenantId]/[filename]/route.ts, not by
  // Next's static public/ handling.
  const logoUrl = `/uploads/branding/${auth.tenant_id}/${fileName}`;

  const updated = await prisma.tenantBranding.upsert({
    where: { tenantId: auth.tenant_id },
    update: { logoUrl, logoMimeType: file.type, logoSizeBytes: file.size },
    create: { tenantId: auth.tenant_id, logoUrl, logoMimeType: file.type, logoSizeBytes: file.size },
  });

  // Best-effort cleanup of the previous file -- a failure here shouldn't
  // fail the upload, it just leaves an orphaned file on disk.
  if (existing?.logoUrl && existing.logoUrl !== logoUrl) {
    const previousPath = path.join(LOGO_STORAGE_ROOT, auth.tenant_id, path.basename(existing.logoUrl));
    await unlink(previousPath).catch(() => {});
  }

  return NextResponse.json(serializeBranding(updated));
});
