import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findManagedMembership } from "@/lib/tenant-users";

interface RouteCtx {
  params: Promise<{ user_id: string }>;
}

const ChangePasswordSchema = z.object({ new_password: z.string().min(8) });

export const POST = withAuth<RouteCtx>(async (request, ctx, auth) => {
  const { user_id } = await ctx.params;
  const membership = await findManagedMembership(auth.tenant_id, user_id);
  if (!membership) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.new_password, 10);
  await prisma.user.update({ where: { id: user_id }, data: { passwordHash } });

  // Changing the password hash changes the membership fingerprint, so any
  // refresh token issued to this account before now stops working on its
  // next refresh -- exactly the "password changed" revocation path from
  // the auth rules.
  return new Response(null, { status: 204 });
}, { roles: ["TenantAdmin"] });
