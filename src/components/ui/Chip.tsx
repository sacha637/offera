import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ className = "", active = false, ...props }: ChipProps) {
  return (
    <button
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-300"
      } ${className}`}
      {...props}
    />
  );
}
