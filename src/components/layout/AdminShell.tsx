"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../lib/firebase/client";
import { useAuth } from "../providers/AuthProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const links = [
  { href: "/admin/offers", label: "Offres" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/suggestions", label: "Suggestions" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/analytics", label: "Analytics" },
];

function parseAdminEmails(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOutUser } = useAuth();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const adminEmails = useMemo(() => {
    return parseAdminEmails(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
  }, []);

  useEffect(() => {
    // 1) Attendre l'auth
    if (loading) return;

    // 2) Pas connecté => login
    if (!user) {
      const next = encodeURIComponent(pathname || "/admin/offers");
      router.replace(`/login?next=${next}`);
      return;
    }

    // 3) Vérif admin (whitelist email OU users/{uid}.role === "admin")
    const run = async () => {
      setChecking(true);
      try {
        const email = (user.email ?? "").toLowerCase();
        if (email && adminEmails.includes(email)) {
          setIsAdmin(true);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const role = (snap.exists() ? (snap.data() as any)?.role : null) ?? null;

        setIsAdmin(role === "admin");
      } catch (e) {
        console.error("Admin check error:", e);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [loading, user, router, pathname, adminEmails]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-500 dark:bg-slate-950">
        Chargement…
      </div>
    );
  }

  // connecté mais pas admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-lg gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Accès refusé
          </h1>

          <Card className="grid gap-3 p-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ton compte n’a pas les droits admin.
            </p>

            <div className="grid gap-2">
              <Button onClick={() => router.replace("/")}>Retour au site</Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await signOutUser();
                  router.replace("/login");
                }}
              >
                Se déconnecter
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Astuce: mets ton email dans <code>NEXT_PUBLIC_ADMIN_EMAILS</code>{" "}
              (env) ou ajoute <code>role: "admin"</code> dans{" "}
              <code>users/{user?.uid}</code>.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ admin ok
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            Offera Admin
          </Link>

          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-emerald-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
