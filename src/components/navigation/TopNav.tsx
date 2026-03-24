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
      <div className="flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-emerald-600">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
