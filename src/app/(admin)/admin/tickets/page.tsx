import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";

const tickets = [
  { id: "tk-1", user: "user@example.com", offer: "Market+", status: "pending" },
  { id: "tk-2", user: "lea@example.com", offer: "GlowLab", status: "pending" },
];

export default function AdminTicketsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tickets</h1>
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {ticket.offer}
              </p>
              <p className="text-xs text-slate-500">{ticket.user}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="info">En attente</Badge>
              <Button variant="secondary">Valider</Button>
              <Button variant="ghost">Rejeter</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
