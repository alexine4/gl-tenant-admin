import { Badge } from "@/components/ui/Badge";

export function Tones() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="positive">Active</Badge>
      <Badge tone="neutral">TenantAdmin</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="negative">Failed</Badge>
    </div>
  );
}
