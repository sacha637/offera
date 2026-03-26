"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "../providers/PreferencesProvider";
import { useAuth } from "../providers/AuthProvider";
import { isAdminEmail } from "../../lib/admin";

const iconClass = "h-6 w-6 shrink-0 stroke-[1.75]";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      className={`${iconClass} ${active ? "text-emerald-600" : "text-slate-600"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function IconTag({ active }: { active: boolean }) {
  return (
    <svg
      className={`${iconClass} ${active ? "text-emerald-600" : "text-slate-600"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5h9l9 9-6 6-9-9V5z"
      />
      <circle cx="7.5" cy="9.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconPlus({ active }: { active: boolean }) {
  return (
    <svg
      className={`${iconClass} ${active ? "text-emerald-600" : "text-slate-600"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconReceipt({ active }: { active: boolean }) {
  return (
    <svg
      className={`${iconClass} ${active ? "text-emerald-600" : "text-slate-600"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path d="M7 3h10v18l-2.5-2-2.5 2-2.5-2-2.5 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function IconHeart({ active }: { active: boolean }) {
  return (
    <svg
      className={`${iconClass} ${active ? "text-emerald-600" : "text-slate-600"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path d="M12 20s-6.5-4.35-9-8.5C.5 8.5 3 4.5 7.5 4.5c2.5 0 4 1.5 4.5 2.5.5-1 2-2.5 4.5-2.5 4.5 0 7 4 4.5 7C18.5 15.65 12 20 12 20Z" />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg
      className={`${iconClass} ${active ? "text-emerald-600" : "text-slate-600"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconShield({ active }: { active: boolean }) {
  return (
    <svg
      className={`${iconClass} ${active ? "text-emerald-600" : "text-slate-600"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path d="M12 3 5 6v6c0 5 3.5 8.5 7 9 3.5-.5 7-4 7-9V6l-7-3Z" />
    </svg>
  );
}

const items: {
  href: string;
  label: string;
  Icon: (p: { active: boolean }) => ReactElement;
}[] = [
  { href: "/", label: "Accueil", Icon: IconHome },
  { href: "/offers", label: "Offres", Icon: IconTag },
  { href: "/offers/suggest", label: "Proposer", Icon: IconPlus },
  { href: "/tickets", label: "Tickets", Icon: IconReceipt },
  { href: "/favorites", label: "Favoris", Icon: IconHeart },
  { href: "/account", label: "Compte", Icon: IconUser },
];

export function BottomNav() {
  const pathname = usePathname();
  const { navStyle } = usePreferences();
  const { user } = useAuth();

  if (navStyle === "top") return null;

  const showAdmin = isAdminEmail(user?.email);

  const linkClass = (active: boolean) =>
    `flex min-h-[52px] min-w-[3.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-center text-[11px] font-semibold leading-tight tracking-tight transition active:scale-[0.98] sm:min-w-[4rem] ${
      active
        ? "bg-emerald-50 text-emerald-800"
        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto max-w-5xl overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full items-stretch justify-center gap-0.5 px-1 sm:gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <Icon active={active} />
                <span className="max-w-[4.75rem] whitespace-normal text-center leading-snug">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {showAdmin ? (
            <Link href="/admin/offers" className={linkClass(pathname.startsWith("/admin"))}>
              <IconShield active={pathname.startsWith("/admin")} />
              <span className="max-w-[4.75rem] text-center leading-snug">Admin</span>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
