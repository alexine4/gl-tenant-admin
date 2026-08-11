import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import {
  queueIngestion,
  serializeDocument,
  validateDocumentFile,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";

// Knowledge-base documents are private tenant data, unlike branding logos --
// stored outside the public/ tree so nothing is reachable without going
// through an authenticated route.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "documents");

export const GET = withAuth(async (_request, _ctx, auth) => {
  const documents = await prisma.document.findMany({
    where: { tenantId: auth.tenant_id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(documents.map(serializeDocument));
});

export const POST = withAuth(async (request, _ctx, auth) => {
  const formData = await request.formData().catch(() => null);
  const files = formData?.getAll("files").filter((f): f is File => f instanceof File) ?? [];

  if (files.length === 0) {
    return NextResponse.json({ error: 'Provide at least one file under "files"' }, { status: 400 });
  }

  const tenantDir = path.join(STORAGE_ROOT, auth.tenant_id);
  await mkdir(tenantDir, { recursive: true });

  // Each file is validated and stored independently so one bad file in a
  // batch doesn't block the rest -- the response reports per-file outcomes.
  const results = await Promise.all(
    files.map(async (file) => {
      const validationError = validateDocumentFile(file);
      if (validationError) {
        return { file_name: file.name, accepted: false, error: validationError };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const storagePath = path.join(tenantDir, `${randomUUID()}-${file.name}`);
      await writeFile(storagePath, buffer);

      const doc = await prisma.document.create({
        data: {
          tenantId: auth.tenant_id,
          uploadedByUserId: auth.sub,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          storagePath,
          status: "Pending",
        },
      });

      queueIngestion(doc.id, buffer);

      return { file_name: file.name, accepted: true, document: serializeDocument(doc) };
    })
  );

  const anyAccepted = results.some((r) => r.accepted);
  return NextResponse.json({ results }, { status: anyAccepted ? 201 : 400 });
});
