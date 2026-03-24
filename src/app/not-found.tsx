import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Page introuvable</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        La page demandée n’existe pas ou a été déplacée.
      </p>
      <Link className="text-sm font-semibold text-emerald-600" href="/">
        Retour à l’accueil
      </Link>
    </div>
  );
}
