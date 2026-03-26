import Link from "next/link";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/offers", label: "Offres" },
  { href: "/tickets", label: "Tickets" },
  { href: "/favorites", label: "Favoris" },
  { href: "/account", label: "Compte" },
];

export function TopNav() {
  return (
    <nav aria-label="Navigation principale" className="hidden md:flex">
      <div className="flex items-center gap-6 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
