import { Alert } from "@/components/ui/Alert";

export function Error() {
  return <Alert variant="error">invalid credentials</Alert>;
}

export function Success() {
  return <Alert variant="success">Saved.</Alert>;
}

export function SmallError() {
  return (
    <Alert variant="error" size="sm">
      Failed to upload logo
    </Alert>
  );
}
