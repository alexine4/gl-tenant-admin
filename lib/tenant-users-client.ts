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
