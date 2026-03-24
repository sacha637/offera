"use client";

import Link from "next/link";
import { TopNav } from "../navigation/TopNav";
import { BRAND_NAME, BRAND_TAGLINE } from "../../lib/brand";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white font-bold">
            {BRAND_NAME.slice(0, 1).toUpperCase()}
          </div>

          <div>
            <p className="text-base font-bold text-slate-900">{BRAND_NAME}</p>
            <p className="text-xs text-slate-500">{BRAND_TAGLINE}</p>
          </div>
        </Link>

        <TopNav />
      </div>
    </header>
  );
}
