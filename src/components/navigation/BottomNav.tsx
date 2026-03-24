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

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                active ? "text-emerald-600" : "text-slate-500 hover:text-emerald-600"
              }`}
            >
              <span aria-hidden="true" className="text-base">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {showAdmin ? (
          <Link
            href="/admin/offers"
            className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-emerald-600"
          >
            <span aria-hidden="true" className="text-base">🛡️</span>
            <span>Admin</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}