import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findManagedMembership, serializeTenantUser } from "@/lib/tenant-users";

interface RouteCtx {
  params: Promise<{ user_id: string }>;
}

export const POST = withAuth<RouteCtx>(async (_request, ctx, auth) => {
  const { user_id } = await ctx.params;
  const membership = await findManagedMembership(auth.tenant_id, user_id);
  if (!membership) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const updated = await prisma.tenantMembership.update({
    where: { tenantId_userId: { tenantId: auth.tenant_id, userId: user_id } },
    data: { status: "Disabled" },
  });

  return NextResponse.json(serializeTenantUser(membership.user, updated));
}, { roles: ["TenantAdmin"] });
