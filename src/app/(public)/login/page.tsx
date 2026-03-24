import Link from "next/link";
import { Suspense } from "react";
import { Card } from "../../../components/ui/Card";
import { LoginForm } from "../../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Connexion</h1>
      <Card className="grid gap-4">
        <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
          <LoginForm />
        </Suspense>
        <p className="text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link className="font-semibold text-emerald-600" href="/register">
            Créer un compte
          </Link>
        </p>
      </Card>
    </div>
  );
}
