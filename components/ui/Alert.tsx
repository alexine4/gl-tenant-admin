import type { ReactNode } from "react";

export type AlertSize = "md" | "sm";

const ERROR_SIZE_CLASSES: Record<AlertSize, string> = {
  md: "rounded-md px-3 py-2 text-sm",
  sm: "rounded-md px-2 py-1 text-xs",
};

export function Alert({
  variant,
  size = "md",
  children,
}: {
  variant: "error" | "success";
  size?: AlertSize;
  children: ReactNode;
}) {
  if (variant === "success") {
    return <p className="text-sm text-emerald-600 dark:text-emerald-400">{children}</p>;
  }
  return (
    <p className={`${ERROR_SIZE_CLASSES[size]} bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300`}>
      {children}
    </p>
  );
}
