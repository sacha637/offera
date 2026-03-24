import { Badge } from "../../../../components/ui/Badge";
import { Card } from "../../../../components/ui/Card";

const items = [
  { id: "tk-1", label: "Courses Market+", status: "pending" },
  { id: "tk-2", label: "Offre Pulse Club", status: "approved" },
  { id: "tk-3", label: "GlowLab", status: "rejected" },
];

const statusMap: Record<string, { label: string; variant: "info" | "success" | "warning" }> = {
  pending: { label: "En attente", variant: "info" },
  approved: { label: "Approuvé", variant: "success" },
  rejected: { label: "Refusé", variant: "warning" },
};

export default function TicketsMinePage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Historique des tickets
      </h1>
      <div className="flex gap-2 text-sm">
        <button className="rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-white">
          Tous
        </button>
        <button className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-200">
          En attente
        </button>
        <button className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-200">
          Approuvés
        </button>
        <button className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-200">
          Refusés
        </button>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-slate-500">ID: {item.id}</p>
            </div>
            <Badge variant={statusMap[item.status].variant}>
              {statusMap[item.status].label}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
