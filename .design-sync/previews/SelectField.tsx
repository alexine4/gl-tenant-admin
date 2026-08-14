import { SelectField } from "@/components/ui/SelectField";

const ROLE_OPTIONS = [
  { value: "TenantOperator", label: "TenantOperator" },
  { value: "TenantMember", label: "TenantMember" },
];

export function Default() {
  return (
    <div className="max-w-sm">
      <SelectField label="Role" options={ROLE_OPTIONS} defaultValue="TenantMember" />
    </div>
  );
}
