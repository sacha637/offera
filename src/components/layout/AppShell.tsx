"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "../navigation/BottomNav";
import { useAuth } from "../providers/AuthProvider";
import { canShowPublicAdminUi } from "../../lib/admin";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Aller au contenu
      </a>

      <AppHeader />

      <main
        id="contenu"
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-5 sm:py-10"
      >
        {children}
      </main>

      {canShowPublicAdminUi(user?.email) && (
        <Link
          href="/admin/offers"
          className="fixed bottom-24 right-4 z-40 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 backdrop-blur hover:text-emerald-600 md:bottom-4"
        >
          Admin
        </Link>
      )}

      <BottomNav />
    </div>
  );
}
