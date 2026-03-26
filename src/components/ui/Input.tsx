import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, id, className = "", ...props }: InputProps) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
      <span>{label}</span>
      <input
        id={inputId}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 ${className}`}
        {...props}
      />
      {hint ? <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}
