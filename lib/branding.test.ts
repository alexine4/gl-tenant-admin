import { describe, expect, it } from "vitest";
import fc from "fast-check";
import type { TenantBranding } from "@prisma/client";
import {
  ALLOWED_LOGO_MIME_TYPES,
  MAX_LOGO_SIZE_BYTES,
  serializeBranding,
  validateLogoFile,
} from "@/lib/branding";

const allowedMimeType = () => fc.constantFrom(...Object.keys(ALLOWED_LOGO_MIME_TYPES));
const validSize = () => fc.integer({ min: 1, max: MAX_LOGO_SIZE_BYTES });

function makeFile(type: string, size: number): File {
  return new File([new Uint8Array(size)], "logo", { type });
}

describe("validateLogoFile", () => {
  it("accepts any allowed MIME type within the valid size range", () => {
    fc.assert(
      fc.property(allowedMimeType(), validSize(), (type, size) => {
        expect(validateLogoFile(makeFile(type, size))).toBeNull();
      })
    );
  });

  it("always rejects image/svg+xml regardless of size", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: MAX_LOGO_SIZE_BYTES }), (size) => {
        expect(validateLogoFile(makeFile("image/svg+xml", size))).not.toBeNull();
      })
    );
  });

  it("rejects sizes outside (0, MAX_LOGO_SIZE_BYTES]", () => {
    fc.assert(
      fc.property(
        allowedMimeType(),
        fc.integer({ min: MAX_LOGO_SIZE_BYTES + 1, max: MAX_LOGO_SIZE_BYTES + 10_000_000 }),
        (type, size) => {
          expect(validateLogoFile(makeFile(type, size))).not.toBeNull();
        }
      )
    );
    expect(validateLogoFile(makeFile("image/png", 0))).not.toBeNull();
  });
});

describe("serializeBranding", () => {
  it("maps a branding record to the expected snake_case shape", () => {
    const updatedAt = new Date("2026-01-15T10:30:00.000Z");
    const branding: TenantBranding = {
      id: "b1",
      tenantId: "t1",
      logoUrl: "/uploads/branding/t1/logo.png",
      logoMimeType: "image/png",
      logoSizeBytes: 1234,
      primaryColor: "#4F46E5",
      secondaryColor: "#111827",
      accentColor: "#22C55E",
      updatedAt,
    };

    expect(serializeBranding(branding)).toEqual({
      logo_url: "/uploads/branding/t1/logo.png",
      logo_mime_type: "image/png",
      logo_size_bytes: 1234,
      primary_color: "#4F46E5",
      secondary_color: "#111827",
      accent_color: "#22C55E",
      updated_at: updatedAt.toISOString(),
    });
  });
});
