import type { ButtonHTMLAttributes } from "react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({ className = "", active = false, ...props }: ChipProps) {
  return (
    <button
      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.99] ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/15"
          : "border-slate-300 bg-white text-slate-800 shadow-sm hover:-translate-y-[1px] hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/25 dark:hover:text-emerald-200"
      } ${className}`}
      {...props}
    />
  );
}
