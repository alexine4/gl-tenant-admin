// @ts-nocheck
import { h, Alert, Badge, Button, Card, Checkbox, DataTable, SelectField, TextField } from "./ds";

const USERS = [
  { id: "1", email: "ops@acme.test", name: "Ops Renamed", role: "TenantOperator", status: "Active" },
  { id: "2", email: "sales-lead@acme.test", name: "Sales Lead", role: "TenantMember", status: "Active" },
  { id: "3", email: "new-hire@acme.test", name: "New Hire", role: "TenantMember", status: "Pending" },
  { id: "4", email: "old-contractor@acme.test", name: "Former Contractor", role: "TenantMember", status: "Disabled" },
];

const STATUS_TONE = { Active: "positive", Pending: "warning", Disabled: "neutral" };

export function Users() {
  return h(
    "div",
    { className: "flex gap-6 max-w-6xl" },
    h(
      "div",
      { className: "flex-1 flex flex-col gap-4" },
      h(
        "div",
        { className: "flex items-center justify-between" },
        h("h1", { className: "text-2xl font-semibold text-zinc-900 dark:text-zinc-50" }, "Users"),
        h(Button, { variant: "primary" }, "New user")
      ),

      h(
        "div",
        { className: "flex flex-wrap items-end gap-3" },
        h(TextField, { label: "Search", placeholder: "Search by email or name", size: "sm" }),
        h(SelectField, {
          label: "Role",
          size: "sm",
          options: [
            { value: "", label: "All roles" },
            { value: "TenantAdmin", label: "TenantAdmin" },
            { value: "TenantOperator", label: "TenantOperator" },
            { value: "TenantMember", label: "TenantMember" },
          ],
        }),
        h(Checkbox, { label: "Show disabled users", defaultChecked: true })
      ),

      h(
        Card,
        null,
        h(
          "div",
          { className: "mb-3 flex items-center gap-3" },
          h(Checkbox, { label: "Select all" }),
          h(Button, { variant: "danger", size: "sm" }, "Deactivate selected"),
          h(Button, { variant: "secondary", size: "sm" }, "Export CSV")
        ),
        h(DataTable, {
          rows: USERS,
          rowKey: (u) => u.id,
          columns: [
            {
              header: "Select",
              cell: () => h(Checkbox, { label: "" }),
              className: "w-6",
            },
            { header: "Email", cell: (u) => u.email },
            { header: "Display name", cell: (u) => u.name },
            { header: "Role", cell: (u) => u.role },
            {
              header: "Status",
              cell: (u) => h(Badge, { tone: STATUS_TONE[u.status] }, u.status),
            },
            {
              header: "Actions",
              cell: () => h(Button, { variant: "link", size: "sm" }, "Edit"),
            },
          ],
        })
      )
    ),

    h(
      Card,
      { title: "New user" },
      h(
        "form",
        { className: "flex w-72 flex-col gap-4" },
        h(TextField, { label: "Email", type: "email", placeholder: "you@company.com", required: true }),
        h(TextField, { label: "Display name", placeholder: "Jane Doe", required: true }),
        h(SelectField, {
          label: "Role",
          options: [
            { value: "TenantMember", label: "TenantMember" },
            { value: "TenantOperator", label: "TenantOperator" },
            { value: "TenantAdmin", label: "TenantAdmin" },
          ],
        }),
        h(Checkbox, { label: "Send invite email", defaultChecked: true }),
        h(Alert, { variant: "error", size: "sm" }, "A user with that email already exists."),
        h(
          "div",
          { className: "flex items-center gap-3" },
          h(Button, { variant: "primary", type: "submit" }, "Create user"),
          h(Button, { variant: "link" }, "Cancel")
        )
      )
    )
  );
}
