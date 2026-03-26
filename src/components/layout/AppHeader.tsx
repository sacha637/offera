"use client";

import Link from "next/link";
import { TopNav } from "../navigation/TopNav";
import { BRAND_NAME, BRAND_TAGLINE } from "../../lib/brand";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-sm ring-2 ring-emerald-500/15">
            {BRAND_NAME.slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-slate-900">{BRAND_NAME}</p>
            <p className="hidden text-xs font-medium text-slate-600 sm:block">{BRAND_TAGLINE}</p>
          </div>
        </Link>

        <TopNav />
      </div>
    </header>
  );
}
