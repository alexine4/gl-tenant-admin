import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { HEX_COLOR_PATTERN, serializeBranding } from "@/lib/branding";
import { prisma } from "@/lib/prisma";

async function getOrCreateBranding(tenantId: string) {
  // Every tenant gets a branding row on creation (see seed.ts), but fall
  // back to creating one on first read/write so this endpoint works even
  // for a tenant provisioned before branding existed.
  return prisma.tenantBranding.upsert({
    where: { tenantId },
    update: {},
    create: { tenantId },
  });
}

export const GET = withAuth(async (_request, _ctx, auth) => {
  const branding = await getOrCreateBranding(auth.tenant_id);
  return NextResponse.json(serializeBranding(branding));
});

const PatchBrandingSchema = z.object({
  primary_color: z.string().regex(HEX_COLOR_PATTERN, "must be a hex color like #4F46E5").optional(),
  secondary_color: z.string().regex(HEX_COLOR_PATTERN, "must be a hex color like #4F46E5").optional(),
  accent_color: z.string().regex(HEX_COLOR_PATTERN, "must be a hex color like #4F46E5").optional(),
});

export const PATCH = withAuth(async (request, _ctx, auth) => {
  const body = await request.json().catch(() => null);
  const parsed = PatchBrandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await getOrCreateBranding(auth.tenant_id);

  const { primary_color, secondary_color, accent_color } = parsed.data;
  const updated = await prisma.tenantBranding.update({
    where: { tenantId: auth.tenant_id },
    data: {
      ...(primary_color ? { primaryColor: primary_color } : {}),
      ...(secondary_color ? { secondaryColor: secondary_color } : {}),
      ...(accent_color ? { accentColor: accent_color } : {}),
    },
  });

  return NextResponse.json(serializeBranding(updated));
});
