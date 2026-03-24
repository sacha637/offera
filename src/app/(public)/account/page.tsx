"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../components/providers/AuthProvider";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOutUser } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <p className="text-slate-500">Chargement…</p>;
  if (!user) return null;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mon compte</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Connecté en tant que : <span className="font-semibold">{user.email}</span>
        </p>
      </div>

      <Card className="grid gap-4 p-6">
        <Button
          onClick={async () => {
            await signOutUser();
            router.replace("/login");
          }}
        >
          Se déconnecter
        </Button>
      </Card>
    </div>
  );
}
