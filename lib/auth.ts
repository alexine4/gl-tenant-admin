import crypto from "crypto";
import { NextResponse } from "next/server";
import type { MembershipRole } from "@prisma/client";
import { auth } from "@/auth";

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AccessTokenClaims {
  sub: string;
  email: string;
  display_name: string;
  tenant_id: string;
  role: MembershipRole;
}

// A fingerprint of "the account's current password-hash and membership
// status". Embedded in the NextAuth JWT and recomputed periodically (see
// auth.ts's jwt callback) so that a password change or a deactivation
// invalidates the session without needing a server-side revocation list.
export function computeMembershipFingerprint(passwordHash: string, status: string): string {
  return crypto.createHash("sha256").update(`${passwordHash}:${status}`).digest("hex");
}

// The single gate every tenant-console endpoint other than NextAuth's own
// /api/auth/* calls. middleware.ts already blocks unauthenticated requests
// to these paths at the edge -- this is the second, per-route layer.
export async function requireAuth(opts?: { roles?: MembershipRole[] }): Promise<AccessTokenClaims> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError(401, "Not authenticated");
  }
  if (opts?.roles && !opts.roles.includes(session.user.role)) {
    throw new AuthError(403, "Your role does not permit this operation");
  }
  return {
    sub: session.user.user_id,
    email: session.user.email ?? "",
    display_name: session.user.display_name,
    tenant_id: session.user.tenant_id,
    role: session.user.role,
  };
}

export function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  throw err;
}

// Convenience wrapper for route handlers: run the gate, then hand the
// verified claims to the handler. Keeps every gated route down to one line
// of auth-related code instead of a repeated try/catch.
export function withAuth<Ctx>(
  handler: (request: Request, ctx: Ctx, auth: AccessTokenClaims) => Promise<Response>,
  opts?: { roles?: MembershipRole[] }
) {
  return async (request: Request, ctx: Ctx) => {
    try {
      const claims = await requireAuth(opts);
      return await handler(request, ctx, claims);
    } catch (err) {
      return authErrorResponse(err);
    }
  };
}
