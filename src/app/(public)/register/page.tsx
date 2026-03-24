import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { RegisterForm } from "../../../components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inscription</h1>
      <Card className="grid gap-4">
        <RegisterForm />
        <p className="text-sm text-slate-500">
          Déjà inscrit ?{" "}
          <Link className="font-semibold text-emerald-600" href="/login">
            Se connecter
          </Link>
        </p>
      </Card>
    </div>
  );
}
