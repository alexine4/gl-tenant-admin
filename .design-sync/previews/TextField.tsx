import { TextField } from "@/components/ui/TextField";

export function Labeled() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <TextField label="Email" type="email" placeholder="you@company.com" defaultValue="admin@acme.test" />
      <TextField label="Password" type="password" placeholder="••••••••" />
    </div>
  );
}

export function Bare() {
  return <TextField type="date" size="sm" defaultValue="2026-07-14" />;
}

export function Sizes() {
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <TextField label="Display name" defaultValue="Acme Admin" />
      <TextField label="New password" type="password" size="sm" placeholder="At least 8 characters" />
    </div>
  );
}
