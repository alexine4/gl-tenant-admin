import type { NextAuthConfig } from "next-auth";
import type { MembershipRole } from "@prisma/client";

// The edge-safe half of the NextAuth config: no providers, no Prisma/bcrypt.
// middleware.ts uses this directly (Edge Runtime can't load Node built-ins
// like "crypto"), while auth.ts extends it with the Credentials provider and
// the Prisma-backed fingerprint recheck for everywhere else (Node runtime).
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.user_id) {
        session.user.user_id = token.user_id;
        session.user.tenant_id = token.tenant_id as string;
        session.user.role = token.role as MembershipRole;
        session.user.display_name = token.display_name as string;
      }
      return session;
    },
  },
};
