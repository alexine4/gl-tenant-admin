import type { MembershipRole, TenantMembership, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// TenantAdmin accounts are explicitly out of scope for this API ("cannot be
// created, promoted to, or removed through this API -- that stays a
// platform-side operation"). We treat that as scoping the whole directory:
// a fellow TenantAdmin never shows up in the list and a lookup by id 404s,
// the same as a user_id that doesn't exist at all.
export const MANAGED_ROLES = ["TenantOperator", "TenantMember"] as const;
export type ManagedRole = (typeof MANAGED_ROLES)[number];

export function isManagedRole(role: MembershipRole): role is ManagedRole {
  return (MANAGED_ROLES as readonly string[]).includes(role);
}

export function serializeTenantUser(user: User, membership: TenantMembership) {
  return {
    user_id: user.id,
    email: user.email,
    display_name: user.displayName,
    role: membership.role,
    status: membership.status,
    created_at: user.createdAt.toISOString(),
  };
}

/**
 * Looks up a membership scoped to the caller's tenant, but only if it's one
 * of the roles this API is allowed to touch. Returns null for: wrong
 * tenant, unknown user, or a TenantAdmin target -- all indistinguishable
 * from the caller's point of view.
 */
export async function findManagedMembership(tenantId: string, userId: string) {
  const membership = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    include: { user: true },
  });
  if (!membership || !isManagedRole(membership.role)) {
    return null;
  }
  return membership;
}
