import crypto from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import type { MembershipRole } from "@prisma/client";

const ACCESS_TOKEN_TTL_SECONDS = 60; // 1 minute, per spec
const REFRESH_TOKEN_TTL_DEFAULT_SECONDS = 30 * 60; // 30 minutes
const REFRESH_TOKEN_TTL_REMEMBER_SECONDS = 7 * 24 * 60 * 60; // 7 days

function secretKey() {
  const secret = process.env.TENANT_AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error("TENANT_AUTH_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// What every other tenant-console endpoint gets after a successful gate
// check. Everything here comes straight from the verified token -- no DB
// read -- so it can be a little stale (bounded by the 1-minute access
// token lifetime) but is always cheap.
export interface AccessTokenClaims {
  sub: string;
  email: string;
  display_name: string;
  tenant_id: string;
  role: MembershipRole;
}

export interface RefreshTokenClaims {
  sub: string;
  tenant_id: string;
  fp: string;
  remember_me: boolean;
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ ...claims, token_use: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function signRefreshToken(claims: RefreshTokenClaims): Promise<string> {
  const ttlSeconds = claims.remember_me
    ? REFRESH_TOKEN_TTL_REMEMBER_SECONDS
    : REFRESH_TOKEN_TTL_DEFAULT_SECONDS;

  return new SignJWT({ ...claims, token_use: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, secretKey()));
  } catch {
    throw new AuthError(401, "Invalid or expired access token");
  }
  if (payload.token_use !== "access") {
    throw new AuthError(401, "Invalid or expired access token");
  }
  return payload as unknown as AccessTokenClaims;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, secretKey()));
  } catch {
    throw new AuthError(401, "Invalid or expired refresh token");
  }
  if (payload.token_use !== "refresh") {
    throw new AuthError(401, "Invalid or expired refresh token");
  }
  return payload as unknown as RefreshTokenClaims;
}

// A fingerprint of "the account's current password-hash and membership
// status". Embedded in every refresh token; recomputed and compared on
// every refresh so that a password change or a deactivation immediately
// invalidates outstanding refresh tokens without needing a server-side
// revocation list.
export function computeMembershipFingerprint(passwordHash: string, status: string): string {
  return crypto.createHash("sha256").update(`${passwordHash}:${status}`).digest("hex");
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

// The single gate every tenant-console endpoint other than the four auth
// endpoints calls. Signature + expiry only, no database round trip.
export async function requireAuth(
  request: Request,
  opts?: { roles?: MembershipRole[] }
): Promise<AccessTokenClaims> {
  const token = getBearerToken(request);
  if (!token) {
    throw new AuthError(401, "Missing bearer access token");
  }
  const claims = await verifyAccessToken(token);
  if (opts?.roles && !opts.roles.includes(claims.role)) {
    throw new AuthError(403, "Your role does not permit this operation");
  }
  return claims;
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
      const auth = await requireAuth(request, opts);
      return await handler(request, ctx, auth);
    } catch (err) {
      return authErrorResponse(err);
    }
  };
}
