"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";

import { Button } from "../../../../../components/ui/Button";
import { Card } from "../../../../../components/ui/Card";
import { Input } from "../../../../../components/ui/Input";
import { db } from "../../../../../lib/firebase/client";
import { fetchCategoriesForUi } from "../../../../../lib/firebase/categories";
import { splitCatalogByType } from "../../../../../lib/catalog";
import { firstLinkUrl, linksToFirestorePayload, type OfferLinkItem } from "../../../../../lib/offerLinks";
import type { Category } from "../../../../../lib/types";

type LinkTypeOpt = "" | NonNullable<OfferLinkItem["type"]>;

type OfferLinkForm = {
  title: string;
  description: string;
  url: string;
  type: LinkTypeOpt;
};

function emptyLinkRow(): OfferLinkForm {
  return { title: "", description: "", url: "", type: "" };
}

export default function AdminOfferNewPage() {
  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);

  const { themes: themeOptions, stores: storeOptions } = useMemo(
    () => splitCatalogByType(categoryOptions),
    [categoryOptions]
  );

  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState(""); // YYYY-MM-DD

  const [promoCode, setPromoCode] = useState("");
  const [qrEnabled, setQrEnabled] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [linkRows, setLinkRows] = useState<OfferLinkForm[]>([emptyLinkRow()]);

  const addLink = () => setLinkRows((prev) => [...prev, emptyLinkRow()]);
  const removeLink = (index: number) => setLinkRows((prev) => prev.filter((_, i) => i !== index));

  const updateLink = (index: number, patch: Partial<OfferLinkForm>) =>
    setLinkRows((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  useEffect(() => {
    fetchCategoriesForUi(db)
      .then(setCategoryOptions)
      .catch(() => setCategoryOptions([]));
  }, []);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }

  function toggleStore(id: string) {
    setStoreIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return [...s];
    });
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Titre et description obligatoires");
      return;
    }

    const linkItems = linksToFirestorePayload(
      linkRows.map((r) => ({
        title: r.title,
        description: r.description.trim() || undefined,
        url: r.url,
        type: r.type || undefined,
      }))
    );

    try {
      const expiresTimestamp = expiresAt
        ? Timestamp.fromDate(new Date(`${expiresAt}T00:00:00`))
        : null;

      const primaryLabel =
        categoryIds
          .map((id) => categoryOptions.find((c) => c.id === id)?.name)
          .find((n) => n && n.trim()) ??
        categoryIds[0] ??
        "Autre";

      await addDoc(collection(db, "offers"), {
        title: title.trim(),
        partner: partner.trim(),
        description: description.trim(),
        categories: categoryIds,
        stores: storeIds,
        category: primaryLabel,

        imageUrl: imageUrl.trim(),

        links: linkItems,
        link: firstLinkUrl(linkItems),

        promoCode: promoCode.trim(),
        qrEnabled,
        isFeatured,
        isActive,

        expiresAt: expiresTimestamp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Offre publiée.");

      setTitle("");
      setPartner("");
      setDescription("");
      setCategoryIds([]);
      setStoreIds([]);
      setImageUrl("");
      setExpiresAt("");
      setPromoCode("");
      setQrEnabled(false);
      setIsFeatured(false);
      setIsActive(true);
      setLinkRows([emptyLinkRow()]);
    } catch (e) {
      console.error("Erreur création offre:", e);
      alert("Erreur lors de la publication");
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Créer une offre</h1>

      <Card className="grid gap-4">
        <Input label="Titre" placeholder="Titre de l’offre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Partenaire" placeholder="Nom du partenaire" value={partner} onChange={(e) => setPartner(e.target.value)} />
        <Input label="Description" placeholder="Description claire" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Thèmes (catégories)</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Types d’offre — sans les enseignes (voir bloc suivant).
          </p>
          <div className="flex max-h-40 flex-wrap gap-x-4 gap-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-600">
            {themeOptions.length === 0 ? (
              <span className="text-xs text-slate-500">Aucun thème disponible.</span>
            ) : (
              themeOptions.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={categoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                  {c.name}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Enseignes</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Catégories Firestore avec type « enseigne ».</p>
          <div className="flex max-h-40 flex-wrap gap-x-4 gap-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-600">
            {storeOptions.length === 0 ? (
              <span className="text-xs text-slate-500">Aucune enseigne (type store).</span>
            ) : (
              storeOptions.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={storeIds.includes(c.id)}
                    onChange={() => toggleStore(c.id)}
                  />
                  {c.name}
                </label>
              ))
            )}
          </div>
        </div>

        <Input label="Image URL" placeholder="https://… (jpg/png/webp)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

        <Input label="Date d’expiration" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />

        <div className="grid gap-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Liens (cartes)</p>

          {linkRows.map((l, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 md:grid-cols-2"
            >
              <Input
                label={`Titre ${idx + 1}`}
                placeholder="Coupon immédiat"
                value={l.title}
                onChange={(e) => updateLink(idx, { title: e.target.value })}
              />
              <Input
                label={`URL ${idx + 1}`}
                placeholder="https://..."
                value={l.url}
                onChange={(e) => updateLink(idx, { url: e.target.value })}
              />
              <Input
                label="Description (optionnel)"
                value={l.description}
                onChange={(e) => updateLink(idx, { description: e.target.value })}
              />
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-100">Type</span>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                  value={l.type}
                  onChange={(e) => updateLink(idx, { type: e.target.value as LinkTypeOpt })}
                >
                  <option value="">—</option>
                  <option value="coupon">Coupon</option>
                  <option value="odr">ODR</option>
                  <option value="shop">Magasin</option>
                  <option value="other">Autre</option>
                </select>
              </label>
              <div className="flex items-end md:col-span-2">
                <Button variant="secondary" type="button" onClick={() => removeLink(idx)} disabled={linkRows.length === 1}>
                  Supprimer ce lien
                </Button>
              </div>
            </div>
          ))}

          <Button variant="secondary" type="button" onClick={addLink}>
            + Ajouter un lien
          </Button>
        </div>

        <Input
          label="Code promo (optionnel)"
          placeholder="Ex: OFFERA10"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
        />

        <div className="flex flex-wrap gap-4 pt-2 text-sm text-slate-700 dark:text-slate-200">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Offre active
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Mettre en Top
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={qrEnabled} onChange={(e) => setQrEnabled(e.target.checked)} />
            QR activé
          </label>
        </div>

        <Button onClick={handleSubmit}>Publier l’offre</Button>
      </Card>
    </div>
  );
}
