import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  info: "bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
