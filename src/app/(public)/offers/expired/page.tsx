import { Card } from "../../../../components/ui/Card";

export default function OffersExpiredPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Offres expirées</h1>
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Les offres terminées apparaîtront ici pour consultation. Activez l’historique
          si vous souhaitez conserver ces données.
        </p>
      </Card>
    </div>
  );
}
