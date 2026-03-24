import { Card } from "../../../../components/ui/Card";

const stats = [
  { label: "Vues d’offres", value: "124k" },
  { label: "Clics", value: "48k" },
  { label: "Copies de code", value: "9.8k" },
  { label: "Ajouts favoris", value: "6.2k" },
  { label: "Tickets envoyés", value: "3.4k" },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tableau de bord détaillé à connecter aux événements Firestore pour les
          performances des offres.
        </p>
      </Card>
    </div>
  );
}
