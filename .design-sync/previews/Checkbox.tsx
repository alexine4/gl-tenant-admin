import { Checkbox } from "@/components/ui/Checkbox";

export function Unchecked() {
  return <Checkbox label="Remember me" />;
}

export function Checked() {
  return <Checkbox label="Remember me" defaultChecked />;
}
