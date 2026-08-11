export type ManagedRole = "TenantOperator" | "TenantMember";
export type MembershipStatus = "Active" | "Disabled";

export interface TenantUser {
  user_id: string;
  email: string;
  display_name: string;
  role: ManagedRole;
  status: MembershipStatus;
  created_at: string;
}

export async function readJsonOrThrow(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof body?.error === "string" ? body.error : JSON.stringify(body?.error ?? "Request failed");
    throw new Error(message);
  }
  return body;
}
