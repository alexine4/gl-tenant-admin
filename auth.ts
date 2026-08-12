import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type {} from "next-auth/jwt";
import type { MembershipRole } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { computeMembershipFingerprint } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// See app/tenant/auth/login/route.ts history for why this exists: a
// valid-format bcrypt hash that never matches a real password, so an
// unknown email costs the same bcrypt.compare() time as a wrong password.
const DUMMY_HASH = bcrypt.hashSync("no-such-account", 10);

const FP_RECHECK_INTERVAL_MS = 60_000;

declare module "next-auth/jwt" {
  interface JWT {
    user_id?: string;
    tenant_id?: string;
    role?: MembershipRole;
    display_name?: string;
    fp?: string;
    fpCheckedAt?: number;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { memberships: true },
        });

        const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        const membership = user?.memberships[0];

        if (!user || !passwordMatches || !membership || membership.status !== "Active") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          tenant_id: membership.tenantId,
          role: membership.role,
          fp: computeMembershipFingerprint(user.passwordHash, membership.status),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.user_id = user.id;
        token.tenant_id = (user as unknown as { tenant_id: string }).tenant_id;
        token.role = (user as unknown as { role: MembershipRole }).role;
        token.display_name = user.name ?? undefined;
        token.fp = (user as unknown as { fp: string }).fp;
        token.fpCheckedAt = Date.now();
        return token;
      }

      const userId = token.user_id;
      if (!userId || !token.fpCheckedAt || Date.now() - token.fpCheckedAt < FP_RECHECK_INTERVAL_MS) {
        return token;
      }

      // Recompute the fingerprint from the DB every ~60s (same cadence the
      // old 60s access token forced) so a password change or a membership
      // being disabled invalidates the session without a revocation list.
      // Only ever runs in the Node runtime (this full config, not
      // middleware's edge-safe auth.config.ts instance).
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: true },
      });
      const membership = dbUser?.memberships.find((m) => m.tenantId === token.tenant_id);
      if (!dbUser || !membership || membership.status !== "Active") {
        return null;
      }
      const currentFp = computeMembershipFingerprint(dbUser.passwordHash, membership.status);
      if (currentFp !== token.fp) {
        return null;
      }
      token.fpCheckedAt = Date.now();
      return token;
    },
  },
});
