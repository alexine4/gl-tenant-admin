import { Button } from "@/components/ui/Button";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Sign in</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger">Deactivate</Button>
      <Button variant="success">Reactivate</Button>
      <Button variant="link">&larr; Back to users</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="md">Save colour scheme</Button>
      <Button size="sm">Export CSV</Button>
    </div>
  );
}

export function States() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Create user</Button>
      <Button variant="primary" disabled>
        Signing in…
      </Button>
      <Button variant="secondary" disabled>
        Uploading…
      </Button>
    </div>
  );
}
