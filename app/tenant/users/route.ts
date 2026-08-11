import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGED_ROLES, serializeTenantUser } from "@/lib/tenant-users";

export const GET = withAuth(async (_request, _ctx, auth) => {
  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId: auth.tenant_id, role: { in: [...MANAGED_ROLES] } },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(memberships.map((m) => serializeTenantUser(m.user, m)));
}, { roles: ["TenantAdmin"] });

const CreateUserSchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(1),
  role: z.enum(MANAGED_ROLES),
  password: z.string().min(8),
});

export const POST = withAuth(async (request, _ctx, auth) => {
  const body = await request.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, display_name, role, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { user, membership } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: email.toLowerCase(), displayName: display_name, passwordHash },
    });
    const membership = await tx.tenantMembership.create({
      data: { tenantId: auth.tenant_id, userId: user.id, role, status: "Active" },
    });
    return { user, membership };
  });

  return NextResponse.json(serializeTenantUser(user, membership), { status: 201 });
}, { roles: ["TenantAdmin"] });
