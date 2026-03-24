"use client";

import Link from "next/link";

export function AdminLink() {
  return (
    <Link
      href="/admin/login"
      className="fixed bottom-3 left-3 z-50 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur hover:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300"
      aria-label="Accès admin"
      title="Admin"
    >
      Admin
    </Link>
  );
}
