import type { SelectHTMLAttributes } from "react";
import { fieldLabelClasses, textFieldClasses } from "@/components/ui/TextField";

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function SelectField({ label, options, className, ...props }: SelectFieldProps) {
  const select = (
    <select className={`${textFieldClasses("md")} ${className ?? ""}`} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  if (!label) return select;
  return (
    <label className={fieldLabelClasses}>
      {label}
      {select}
    </label>
  );
}
