"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { useAuth } from "../../../../components/providers/AuthProvider";
import { isAdminEmail } from "../../../../lib/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const alreadyAdmin = useMemo(() => isAdminEmail(user?.email), [user?.email]);

  // Si déjà connecté admin -> go admin direct
  if (!loading && user && alreadyAdmin) {
    router.replace("/admin/offers");
    return null;
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Connexion admin
      </h1>

      <Card className="grid gap-4 p-6">
        <Input
          label="Email"
          placeholder="admin@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Mot de passe
          </label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {err ? <p className="text-sm text-red-600">{err}</p> : null}

        <Button
          disabled={submitting || !email.trim() || !password.trim()}
          onClick={async () => {
            setErr(null);
            setSubmitting(true);
            try {
              await signIn(email.trim(), password);

              // 🔒 Après login, on check whitelist
              if (!isAdminEmail(email.trim())) {
                setErr("Compte non admin (email pas dans la whitelist).");
                return;
              }

              router.replace("/admin/offers");
            } catch (e: any) {
              setErr(e?.message ?? "Erreur de connexion");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          Se connecter
        </Button>

        <p className="text-xs text-slate-500">
          Seuls les emails présents dans <code>NEXT_PUBLIC_ADMIN_EMAILS</code> peuvent accéder au mode admin.
        </p>
      </Card>
    </div>
  );
}
