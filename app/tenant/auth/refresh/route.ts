import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthError,
  computeMembershipFingerprint,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RefreshSchema = z.object({ refresh_token: z.string().min(1) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RefreshSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  try {
    const claims = await verifyRefreshToken(parsed.data.refresh_token);

    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: claims.tenant_id, userId: claims.sub } },
      include: { user: true },
    });

    const currentFingerprint = membership
      ? computeMembershipFingerprint(membership.user.passwordHash, membership.status)
      : null;

    // The fingerprint mismatches the moment the password changes or the
    // membership is deactivated/reactivated after this token was issued --
    // that's the whole revocation mechanism, no server-side token store needed.
    if (!membership || currentFingerprint !== claims.fp) {
      return NextResponse.json(
        { error: "refresh denied, please log in again" },
        { status: 401 }
      );
    }

    const accessToken = await signAccessToken({
      sub: membership.user.id,
      email: membership.user.email,
      display_name: membership.user.displayName,
      tenant_id: membership.tenantId,
      role: membership.role,
    });

    // Always a brand-new rotated pair, preserving the original remember-me
    // duration choice so a "remembered" session doesn't quietly shrink to
    // 30 minutes on its first silent refresh.
    const refreshToken = await signRefreshToken({
      sub: membership.user.id,
      tenant_id: membership.tenantId,
      fp: currentFingerprint,
      remember_me: claims.remember_me,
    });

    return NextResponse.json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
