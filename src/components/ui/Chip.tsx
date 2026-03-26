import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ className = "", active = false, ...props }: ChipProps) {
  return (
    <button
      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-800 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
      } ${className}`}
      {...props}
    />
  );
}
