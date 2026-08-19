import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/auth", () => ({ auth: authMock }));

import { AuthError, authErrorResponse, computeMembershipFingerprint, requireAuth, withAuth } from "@/lib/auth";

const fakeHash = () => fc.string({ minLength: 1, maxLength: 60 });
const fakeStatus = () => fc.constantFrom("Active", "Disabled");

describe("computeMembershipFingerprint", () => {
  it("is deterministic for the same inputs", () => {
    fc.assert(
      fc.property(fakeHash(), fakeStatus(), (passwordHash, status) => {
        expect(computeMembershipFingerprint(passwordHash, status)).toBe(
          computeMembershipFingerprint(passwordHash, status)
        );
      })
    );
  });

  it("changes when the password hash changes (status held constant)", () => {
    fc.assert(
      fc.property(fakeHash(), fakeHash(), fakeStatus(), (hashA, hashB, status) => {
        fc.pre(hashA !== hashB);
        expect(computeMembershipFingerprint(hashA, status)).not.toBe(computeMembershipFingerprint(hashB, status));
      })
    );
  });

  it("changes when the membership status changes (password hash held constant)", () => {
    fc.assert(
      fc.property(fakeHash(), (passwordHash) => {
        expect(computeMembershipFingerprint(passwordHash, "Active")).not.toBe(
          computeMembershipFingerprint(passwordHash, "Disabled")
        );
      })
    );
  });
});

describe("requireAuth", () => {
  it("throws a 401 AuthError when there is no session", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(requireAuth()).rejects.toMatchObject({ status: 401 });
  });

  it("throws a 403 AuthError when the session's role is not permitted", async () => {
    authMock.mockResolvedValueOnce({
      user: { user_id: "u1", email: "a@b.test", display_name: "A", tenant_id: "t1", role: "TenantMember" },
    });
    await expect(requireAuth({ roles: ["TenantAdmin"] })).rejects.toMatchObject({ status: 403 });
  });

  it("returns the caller's claims when authenticated and authorized", async () => {
    authMock.mockResolvedValueOnce({
      user: { user_id: "u1", email: "a@b.test", display_name: "A", tenant_id: "t1", role: "TenantAdmin" },
    });
    await expect(requireAuth({ roles: ["TenantAdmin"] })).resolves.toEqual({
      sub: "u1",
      email: "a@b.test",
      display_name: "A",
      tenant_id: "t1",
      role: "TenantAdmin",
    });
  });
});

describe("withAuth", () => {
  it("invokes the wrapped handler with resolved claims when authorized", async () => {
    authMock.mockResolvedValueOnce({
      user: { user_id: "u1", email: "a@b.test", display_name: "A", tenant_id: "t1", role: "TenantAdmin" },
    });
    const handler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = withAuth(handler, { roles: ["TenantAdmin"] });
    const response = await wrapped(new Request("http://test/x"), {});
    expect(response.status).toBe(204);
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      {},
      expect.objectContaining({ sub: "u1", role: "TenantAdmin" })
    );
  });

  it("returns an auth error response instead of invoking the handler when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null);
    const handler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = withAuth(handler);
    const response = await wrapped(new Request("http://test/x"), {});
    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("authErrorResponse", () => {
  it("converts an AuthError into a matching JSON response", async () => {
    const response = authErrorResponse(new AuthError(403, "nope"));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "nope" });
  });

  it("rethrows non-AuthError values", () => {
    expect(() => authErrorResponse(new Error("boom"))).toThrow("boom");
  });
});
