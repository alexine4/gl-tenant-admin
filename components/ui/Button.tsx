import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "link";
export type ButtonSize = "md" | "sm";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:opacity-90",
  secondary:
    "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
  danger: "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600",
  success: "bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600",
  link: "text-zinc-500 dark:text-zinc-400 hover:underline",
};

const SIZE_CLASSES: Record<Exclude<ButtonVariant, "link">, Record<ButtonSize, string>> = {
  primary: { md: "rounded-full px-4 py-2 text-sm font-medium", sm: "rounded-full px-3 py-1.5 text-xs font-medium" },
  secondary: { md: "rounded-full px-4 py-2 text-sm font-medium", sm: "rounded-full px-3 py-1.5 text-xs font-medium" },
  danger: { md: "rounded-full px-4 py-2 text-sm font-medium", sm: "rounded-full px-3 py-1.5 text-xs font-medium" },
  success: { md: "rounded-full px-4 py-2 text-sm font-medium", sm: "rounded-full px-3 py-1.5 text-xs font-medium" },
};

const LINK_SIZE_CLASSES: Record<ButtonSize, string> = { md: "text-sm", sm: "text-xs" };

/** Builds the class string alone, for elements that must look like a button but aren't one (e.g. a Next.js `<Link>`). */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  if (variant === "link") return `${VARIANT_CLASSES.link} ${LINK_SIZE_CLASSES[size]}`;
  return `${SIZE_CLASSES[variant][size]} ${VARIANT_CLASSES[variant]} disabled:opacity-50`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={`${buttonClasses(variant, size)} ${className ?? ""}`} {...props} />;
}
