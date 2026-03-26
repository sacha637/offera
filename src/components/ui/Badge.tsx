import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "info";

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-slate-100 text-slate-800 ring-1 ring-inset ring-slate-200/60 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/70",
  success:
    "bg-emerald-100 text-emerald-950 ring-1 ring-inset ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-500/25",
  warning:
    "bg-amber-100 text-amber-950 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/25",
  info: "bg-sky-100 text-sky-950 ring-1 ring-inset ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-100 dark:ring-sky-500/25",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-tight shadow-sm ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
