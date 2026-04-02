"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { Input } from "../../../../components/ui/Input";
import { db } from "../../../../lib/firebase/client";
import {
  createCategory,
  deleteCategory,
  fetchAllCategoriesAdmin,
  updateCategory,
} from "../../../../lib/firebase/categories";
import type { Category } from "../../../../lib/types";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "theme", label: "Thème" },
  { value: "store", label: "Enseigne / magasin" },
];

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editType, setEditType] = useState("");
  const [editActive, setEditActive] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await fetchAllCategoriesAdmin(db);
      setRows(list);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les catégories (droits Firestore ou réseau).");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd() {
    if (!newName.trim()) {
      setError("Indiquez un nom.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createCategory(db, {
        name: newName.trim(),
        type: newType || undefined,
        active: true,
      });
      setNewName("");
      setNewType("");
      await load();
    } catch (e) {
      console.error(e);
      setError("Création refusée ou erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug ?? "");
    setEditType(c.type ?? "");
    setEditActive(c.active !== false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await updateCategory(db, editingId, {
        name: editName.trim(),
        slug: editSlug.trim() || undefined,
        type: editType || null,
        active: editActive,
      });
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      setError("Enregistrement impossible (slug en doublon ou droits).");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Supprimer la catégorie « ${name} » ?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(db, id);
      if (editingId === id) setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      setError("Suppression refusée ou erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Catégories</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Stockage Firestore <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">categories</code>.
        Les visiteurs ne voient que les entrées actives.
      </p>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="grid gap-4">
        <Input
          label="Nouvelle catégorie"
          placeholder="Ex: Mode"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-100">Type (optionnel)</span>
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value || "none"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" disabled={busy} onClick={onAdd}>
          Ajouter
        </Button>
      </Card>

      <div className="grid gap-3">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : rows.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600 dark:text-slate-300">
            Aucune catégorie. Ajoutez-en une ci-dessus.
          </Card>
        ) : (
          rows.map((category) => (
            <Card key={category.id} className="grid gap-3">
              {editingId === category.id ? (
                <>
                  <Input label="Nom" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Input
                    label="Slug (URL)"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    placeholder="auto"
                  />
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-100">Type</span>
                    <select
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                    >
                      {TYPE_OPTIONS.map((o) => (
                        <option key={o.value || "none-e"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                    />
                    Active (visible publiquement)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={busy} onClick={saveEdit}>
                      Enregistrer
                    </Button>
                    <Button type="button" variant="secondary" disabled={busy} onClick={cancelEdit}>
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{category.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      slug: {category.slug ?? "—"} · id: {category.id}
                      {category.type ? ` · type: ${category.type}` : ""} ·{" "}
                      {category.active !== false ? (
                        <span className="text-emerald-700 dark:text-emerald-400">active</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400">inactive</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" disabled={busy} onClick={() => startEdit(category)}>
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      className="border-red-200 text-red-800 hover:bg-red-50 dark:border-red-900 dark:text-red-200"
                      onClick={() => onDelete(category.id, category.name)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
