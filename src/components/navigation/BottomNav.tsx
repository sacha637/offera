"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "../providers/PreferencesProvider";
import { useAuth } from "../providers/AuthProvider";
import { isAdminEmail } from "../../lib/admin";

const items = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/offers", label: "Offres", icon: "🏷️" },
  { href: "/offers/suggest", label: "Proposer", icon: "➕" }, // ✅ nouveau
  { href: "/tickets", label: "Tickets", icon: "🧾" },
  { href: "/favorites", label: "Favoris", icon: "❤️" },
  { href: "/account", label: "Compte", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { navStyle } = usePreferences();
  const { user } = useAuth();

  if (navStyle === "top") return null;

  const showAdmin = isAdminEmail(user?.email);

  const linkClass = (active: boolean) =>
    `flex min-h-[48px] min-w-[3.75rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-center text-[11px] font-semibold leading-tight transition sm:min-w-[4.25rem] ${
      active ? "text-emerald-600" : "text-slate-500 hover:text-emerald-600"
    }`;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden"
    >
      <div className="mx-auto max-w-5xl overflow-x-auto overscroll-x-contain px-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full items-stretch justify-center gap-1 px-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <span aria-hidden="true" className="text-lg leading-none">
                  {item.icon}
                </span>
                <span className="max-w-[4.5rem] leading-tight break-words">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {showAdmin ? (
            <Link href="/admin/offers" className={linkClass(false)}>
              <span aria-hidden="true" className="text-lg leading-none">
                🛡️
              </span>
              <span className="max-w-[4.5rem] leading-tight break-words">Admin</span>
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}