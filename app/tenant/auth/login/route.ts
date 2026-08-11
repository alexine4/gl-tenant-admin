import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { computeMembershipFingerprint, signAccessToken, signRefreshToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// A valid-format bcrypt hash that never matches a real password. Compared
// against when the email lookup misses, so an unknown email costs the same
// bcrypt.compare() time as a wrong password -- otherwise response timing
// would leak which of the two happened, defeating the single generic error.
const DUMMY_HASH = bcrypt.hashSync("no-such-account", 10);

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember_me: z.boolean().optional(),
});

function invalidCredentials() {
  return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { email, password, remember_me = false } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { memberships: true },
  });

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  const membership = user?.memberships[0];

  // Unknown email, wrong password, or a disabled membership all collapse
  // into the same outcome -- never reveal which case applied.
  if (!user || !passwordMatches || !membership || membership.status !== "Active") {
    return invalidCredentials();
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    display_name: user.displayName,
    tenant_id: membership.tenantId,
    role: membership.role,
  });

  const refreshToken = await signRefreshToken({
    sub: user.id,
    tenant_id: membership.tenantId,
    fp: computeMembershipFingerprint(user.passwordHash, membership.status),
    remember_me,
  });

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      user_id: user.id,
      email: user.email,
      display_name: user.displayName,
      tenant_id: membership.tenantId,
      role: membership.role,
    },
  });
}
