"use client";

import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";
import { canShowPublicAdminUi } from "../../lib/admin";

export function AdminLink() {
  const { user } = useAuth();

  if (!canShowPublicAdminUi(user?.email)) {
    return null;
  }

  return (
    <Link
      href="/admin/login"
      className="fixed bottom-3 left-3 z-50 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100"
      aria-label="Accès admin"
      title="Admin"
    >
      Admin
    </Link>
  );
}
