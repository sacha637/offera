"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "../../components/layout/AdminShell";
import { useAuth } from "../../components/providers/AuthProvider";
import { isAdminEmail } from "../../lib/admin";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return <p className="text-slate-500">Chargement…</p>;

  // pas connecté -> login
  if (!user) {
    router.replace("/login");
    return null;
  }

  // connecté mais pas admin -> accès refusé (pas de 500)
  if (!isAdminEmail(user.email)) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Accès refusé
        </h1>
        <Card className="mt-4 grid gap-3 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ce compte n’a pas accès au mode admin.
          </p>
          <Button onClick={() => router.replace("/")}>Retour à l’accueil</Button>
        </Card>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
