import type { MembershipRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      user_id: string;
      tenant_id: string;
      role: MembershipRole;
      display_name: string;
    } & DefaultSession["user"];
  }

  interface User {
    tenant_id?: string;
    role?: MembershipRole;
    fp?: string;
  }
}
