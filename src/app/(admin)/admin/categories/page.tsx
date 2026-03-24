import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { Input } from "../../../../components/ui/Input";
import { categories } from "../../../../lib/mock";

export default function AdminCategoriesPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Catégories</h1>
      <Card className="grid gap-4">
        <Input label="Nouvelle catégorie" placeholder="Ex: Mode" />
        <Button>Ajouter</Button>
      </Card>
      <div className="grid gap-3">
        {categories.map((category) => (
          <Card key={category.id} className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {category.name}
            </p>
            <Button variant="secondary">Modifier</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
