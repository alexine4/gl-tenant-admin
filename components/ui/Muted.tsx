import type { ReactNode } from "react";

const SIZE_CLASSES = { sm: "text-sm", xs: "text-xs" } as const;

/** Loading / uploading / empty-state text -- always paired with its dark: variant. */
export function Muted({
  children,
  size = "sm",
  className,
}: {
  children: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return <p className={`${SIZE_CLASSES[size]} text-zinc-500 dark:text-zinc-400 ${className ?? ""}`}>{children}</p>;
}
