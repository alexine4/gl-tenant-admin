import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";

interface TenantUserRow {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  status: "Active" | "Disabled";
}

const ROWS: TenantUserRow[] = [
  { user_id: "1", email: "ops@acme.test", display_name: "Ops Renamed", role: "TenantMember", status: "Active" },
  { user_id: "2", email: "sales@acme.test", display_name: "Sales Lead", role: "TenantOperator", status: "Active" },
  { user_id: "3", email: "old@acme.test", display_name: "Former Contractor", role: "TenantMember", status: "Disabled" },
];

export function Comfortable() {
  return (
    <DataTable
      rows={ROWS}
      rowKey={(u) => u.user_id}
      columns={[
        { header: "Email", cell: (u) => u.email },
        { header: "Display name", cell: (u) => u.display_name },
        { header: "Role", cell: (u) => u.role },
        { header: "Status", cell: (u) => <Badge tone={u.status === "Active" ? "positive" : "neutral"}>{u.status}</Badge> },
      ]}
    />
  );
}

export function Compact() {
  return (
    <DataTable
      density="compact"
      hoverable={false}
      rows={ROWS}
      rowKey={(u) => u.user_id}
      columns={[
        { header: "Email", cell: (u) => u.email },
        { header: "Role", cell: (u) => u.role },
      ]}
    />
  );
}
