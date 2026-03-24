"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../providers/AuthProvider";
import { isAdminEmail } from "../../lib/admin";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, signOutUser } = useAuth();

  const isAdmin = useMemo(() => {
    return isAdminEmail(user?.email);
  }, [user?.email]);

  useEffect(() => {
    // auth en chargement -> on attend
    if (loading) return;

    // pas connecté -> on force login admin
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    // connecté mais pas admin -> on laisse afficher "access denied"
  }, [loading, user, router]);

  if (loading) {
    return <p className="text-slate-500">Chargement…</p>;
  }

  if (!user) {
    // on redirige déjà, mais on évite flash
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Accès refusé
        </h1>

        <Card className="grid gap-3 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tu es connecté, mais ton compte n’est pas admin.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => router.replace("/")}
            >
              Retour au site
            </Button>

            <Button
              onClick={async () => {
                await signOutUser();
                router.replace("/admin/login");
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
