import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { ALLOWED_LOGO_MIME_TYPES, serializeBranding, validateLogoFile } from "@/lib/branding";
import { prisma } from "@/lib/prisma";

// Logos are tenant-branding assets meant to be shown across that tenant's
// experience, so -- unlike knowledge-base documents -- they're stored under
// the public/ tree and served as plain static files, no auth required to view.
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "branding");

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
  const tenantDir = path.join(UPLOAD_ROOT, auth.tenant_id);
  await mkdir(tenantDir, { recursive: true });
  await writeFile(path.join(tenantDir, fileName), Buffer.from(await file.arrayBuffer()));

  const logoUrl = `/uploads/branding/${auth.tenant_id}/${fileName}`;

  const updated = await prisma.tenantBranding.upsert({
    where: { tenantId: auth.tenant_id },
    update: { logoUrl, logoMimeType: file.type, logoSizeBytes: file.size },
    create: { tenantId: auth.tenant_id, logoUrl, logoMimeType: file.type, logoSizeBytes: file.size },
  });

  // Best-effort cleanup of the previous file -- a failure here shouldn't
  // fail the upload, it just leaves an orphaned file on disk.
  if (existing?.logoUrl && existing.logoUrl !== logoUrl) {
    const previousPath = path.join(process.cwd(), "public", existing.logoUrl.replace(/^\//, ""));
    await unlink(previousPath).catch(() => {});
  }

  return NextResponse.json(serializeBranding(updated));
});
