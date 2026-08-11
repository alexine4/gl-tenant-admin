import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGED_ROLES, findManagedMembership, serializeTenantUser } from "@/lib/tenant-users";

interface RouteCtx {
  params: Promise<{ user_id: string }>;
}

export const GET = withAuth<RouteCtx>(async (_request, ctx, auth) => {
  const { user_id } = await ctx.params;
  const membership = await findManagedMembership(auth.tenant_id, user_id);
  if (!membership) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }
  return NextResponse.json(serializeTenantUser(membership.user, membership));
}, { roles: ["TenantAdmin"] });

const PatchUserSchema = z.object({
  email: z.string().email().optional(),
  display_name: z.string().min(1).optional(),
  role: z.enum(MANAGED_ROLES).optional(),
});

export const PATCH = withAuth<RouteCtx>(async (request, ctx, auth) => {
  const { user_id } = await ctx.params;
  const membership = await findManagedMembership(auth.tenant_id, user_id);
  if (!membership) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PatchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, display_name, role } = parsed.data;

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing && existing.id !== user_id) {
      return NextResponse.json({ error: "email already in use" }, { status: 409 });
    }
  }

  const [updatedUser, updatedMembership] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user_id },
      data: {
        ...(email ? { email: email.toLowerCase() } : {}),
        ...(display_name ? { displayName: display_name } : {}),
      },
    }),
    prisma.tenantMembership.update({
      where: { tenantId_userId: { tenantId: auth.tenant_id, userId: user_id } },
      data: role ? { role } : {},
    }),
  ]);

  return NextResponse.json(serializeTenantUser(updatedUser, updatedMembership));
}, { roles: ["TenantAdmin"] });
