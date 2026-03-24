import { Button } from "../../../../../../components/ui/Button";
import { Card } from "../../../../../../components/ui/Card";
import { Input } from "../../../../../../components/ui/Input";

export default function AdminOfferEditPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Éditer l’offre</h1>
      <Card className="grid gap-4">
        <Input label="Titre" placeholder="Titre de l’offre" />
        <Input label="Partenaire" placeholder="Nom du partenaire" />
        <Input label="Description" placeholder="Description claire" />
        <Input label="Catégorie" placeholder="Sélectionner une catégorie" />
        <Input label="Priority" type="number" />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">Prévisualiser</Button>
          <Button variant="secondary">Dupliquer</Button>
          <Button>Mettre à jour</Button>
        </div>
      </Card>
    </div>
  );
}
