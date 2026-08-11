import { forwardRef, type InputHTMLAttributes } from "react";

export const FileField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function FileField({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="file"
        className={`block text-sm text-zinc-700 dark:text-zinc-300 ${className ?? ""}`}
        {...props}
      />
    );
  }
);
