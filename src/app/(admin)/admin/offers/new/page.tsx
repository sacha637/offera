"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";

import { Button } from "../../../../../components/ui/Button";
import { Card } from "../../../../../components/ui/Card";
import { Input } from "../../../../../components/ui/Input";
import { db } from "../../../../../lib/firebase/client";

type OfferLink = { label: string; url: string };

export default function AdminOfferNewPage() {
  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState(""); // YYYY-MM-DD

  const [promoCode, setPromoCode] = useState("");
  const [qrEnabled, setQrEnabled] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [links, setLinks] = useState<OfferLink[]>([{ label: "Amazon", url: "" }]);

  const addLink = () => setLinks((prev) => [...prev, { label: "", url: "" }]);
  const removeLink = (index: number) =>
    setLinks((prev) => prev.filter((_, i) => i !== index));

  const updateLink = (index: number, patch: Partial<OfferLink>) =>
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Titre et description obligatoires");
      return;
    }

    const cleanedLinks = links
      .map((l) => ({
        label: (l.label ?? "").trim() || `Lien`,
        url: (l.url ?? "").trim(),
      }))
      .filter((l) => l.url.length > 0);

    try {
      const expiresTimestamp = expiresAt
        ? Timestamp.fromDate(new Date(`${expiresAt}T00:00:00`))
        : null;

      await addDoc(collection(db, "offers"), {
        title: title.trim(),
        partner: partner.trim(),
        description: description.trim(),
        category: category.trim(),

        imageUrl: imageUrl.trim(),

        // multi-liens + compat avec l’ancien champ
        links: cleanedLinks,
        link: cleanedLinks[0]?.url ?? "",

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
      setCategory("");
      setImageUrl("");
      setExpiresAt("");
      setPromoCode("");
      setQrEnabled(false);
      setIsFeatured(false);
      setIsActive(true);
      setLinks([{ label: "Amazon", url: "" }]);
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
        <Input label="Catégorie" placeholder="Ex: Tech, Voyage, Restauration" value={category} onChange={(e) => setCategory(e.target.value)} />

        <Input label="Image URL" placeholder="https://… (jpg/png/webp)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />

        <Input label="Date d’expiration" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />

        <div className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Liens (plusieurs plateformes)
          </p>

          <div className="grid gap-3">
            {links.map((l, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
                {/* ✅ label toujours string */}
                <Input
                  label={`Label lien ${idx + 1}`}
                  placeholder="Amazon / Fnac / Cdiscount…"
                  value={l.label}
                  onChange={(e) => updateLink(idx, { label: e.target.value })}
                />

                <Input
                  label={`URL lien ${idx + 1}`}
                  placeholder="https://..."
                  value={l.url}
                  onChange={(e) => updateLink(idx, { url: e.target.value })}
                />

                <Button
                  variant="secondary"
                  onClick={() => removeLink(idx)}
                  disabled={links.length === 1}
                >
                  Supprimer
                </Button>
              </div>
            ))}
          </div>

          <Button variant="secondary" onClick={addLink}>
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
