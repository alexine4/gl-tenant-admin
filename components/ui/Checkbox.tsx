import type { InputHTMLAttributes } from "react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 ${className ?? ""}`}
        {...props}
      />
      {label}
    </label>
  );
}
