import type { InputHTMLAttributes } from "react";

export type FieldSize = "md" | "sm";

const SIZE_CLASSES: Record<FieldSize, string> = {
  md: "rounded-md px-3 py-2 text-sm",
  sm: "rounded-md px-2 py-1 text-xs",
};

export function textFieldClasses(size: FieldSize = "md"): string {
  return `${SIZE_CLASSES[size]} border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-zinc-500`;
}

export const fieldLabelClasses = "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Omit to render a bare input (e.g. below a heading that already names the field). */
  label?: string;
  size?: FieldSize;
}

export function TextField({ label, size = "md", className, ...props }: TextFieldProps) {
  const input = <input className={`${textFieldClasses(size)} ${className ?? ""}`} {...props} />;
  if (!label) return input;
  return (
    <label className={fieldLabelClasses}>
      {label}
      {input}
    </label>
  );
}
