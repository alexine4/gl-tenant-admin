import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import type { MembershipRole, TenantMembership, User } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({ prisma: { tenantMembership: { findUnique: vi.fn() } } }));

import { MANAGED_ROLES, isManagedRole, serializeTenantUser } from "@/lib/tenant-users";

const ALL_ROLES: MembershipRole[] = ["TenantAdmin", "TenantOperator", "TenantMember"];

describe("isManagedRole", () => {
  it("agrees with a reference includes-check for every MembershipRole value", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_ROLES), (role) => {
        expect(isManagedRole(role)).toBe((MANAGED_ROLES as readonly string[]).includes(role));
      })
    );
  });

  it("returns false for TenantAdmin and true for TenantOperator/TenantMember", () => {
    expect(isManagedRole("TenantAdmin")).toBe(false);
    expect(isManagedRole("TenantOperator")).toBe(true);
    expect(isManagedRole("TenantMember")).toBe(true);
  });
});

describe("serializeTenantUser", () => {
  it("maps a user + membership pair to the expected snake_case shape", () => {
    const createdAt = new Date("2026-03-01T00:00:00.000Z");
    const user: User = {
      id: "u1",
      email: "operator@acme.test",
      passwordHash: "hash",
      displayName: "Ops User",
      createdAt,
      updatedAt: createdAt,
    };
    const membership: TenantMembership = {
      id: "m1",
      tenantId: "t1",
      userId: "u1",
      role: "TenantOperator",
      status: "Active",
      createdAt,
      updatedAt: createdAt,
    };

    expect(serializeTenantUser(user, membership)).toEqual({
      user_id: "u1",
      email: "operator@acme.test",
      display_name: "Ops User",
      role: "TenantOperator",
      status: "Active",
      created_at: createdAt.toISOString(),
    });
  });
});
