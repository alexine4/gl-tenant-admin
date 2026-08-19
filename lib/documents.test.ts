import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import type { Document } from "@prisma/client";

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/prisma", () => ({ prisma: { document: { update: updateMock } } }));

import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  queueIngestion,
  serializeDocument,
  validateDocumentFile,
} from "@/lib/documents";

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

const allowedMimeType = () => fc.constantFrom(...Array.from(ALLOWED_DOCUMENT_MIME_TYPES));
const allowedExtension = () => fc.constantFrom(...Array.from(ALLOWED_DOCUMENT_EXTENSIONS));
const validSize = () => fc.integer({ min: 1, max: MAX_DOCUMENT_SIZE_BYTES });

describe("validateDocumentFile", () => {
  it("accepts a valid size with an allowed MIME type", () => {
    fc.assert(
      fc.property(allowedMimeType(), validSize(), (type, size) => {
        expect(validateDocumentFile(makeFile("file.bin", type, size))).toBeNull();
      })
    );
  });

  it("accepts a valid size with an allowed extension even when the MIME type is unrecognized", () => {
    fc.assert(
      fc.property(allowedExtension(), validSize(), (ext, size) => {
        expect(validateDocumentFile(makeFile(`file.${ext}`, "application/octet-stream", size))).toBeNull();
      })
    );
  });

  it("rejects files outside the valid size range", () => {
    expect(validateDocumentFile(makeFile("file.txt", "text/plain", 0))).not.toBeNull();
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_DOCUMENT_SIZE_BYTES + 1, max: MAX_DOCUMENT_SIZE_BYTES + 10_000_000 }),
        (size) => {
          expect(validateDocumentFile(makeFile("file.txt", "text/plain", size))).not.toBeNull();
        }
      )
    );
  });

  it("rejects a valid size when neither MIME type nor extension is allowed", () => {
    fc.assert(
      fc.property(validSize(), (size) => {
        expect(validateDocumentFile(makeFile("file.exe", "application/x-msdownload", size))).not.toBeNull();
      })
    );
  });
});

describe("serializeDocument", () => {
  it("maps a document record to the expected snake_case shape", () => {
    const createdAt = new Date("2026-02-01T00:00:00.000Z");
    const updatedAt = new Date("2026-02-02T00:00:00.000Z");
    const doc: Document = {
      id: "d1",
      tenantId: "t1",
      uploadedByUserId: "u1",
      fileName: "report.pdf",
      mimeType: "application/pdf",
      sizeBytes: 5000,
      storagePath: "/storage/documents/t1/d1",
      status: "Pending",
      failureReason: null,
      createdAt,
      updatedAt,
    };

    expect(serializeDocument(doc)).toEqual({
      document_id: "d1",
      file_name: "report.pdf",
      mime_type: "application/pdf",
      size_bytes: 5000,
      status: "Pending",
      failure_reason: null,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    });
  });
});

describe("queueIngestion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    updateMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks the document Ingested when the content has no failure marker", async () => {
    queueIngestion("doc-1", Buffer.from("normal document content"));
    await vi.runAllTimersAsync();
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      data: { status: "Ingested", failureReason: null },
    });
  });

  it("marks the document Failed when the content includes the FORCE_FAIL marker", async () => {
    queueIngestion("doc-2", Buffer.from("some content FORCE_FAIL more content"));
    await vi.runAllTimersAsync();
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "doc-2" },
      data: { status: "Failed", failureReason: "Ingestion pipeline rejected the document content" },
    });
  });
});
