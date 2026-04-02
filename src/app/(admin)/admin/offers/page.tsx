"use client";

import { useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, getFirebaseStorage } from "../../../../lib/firebase/client";
import { fetchCategoriesForUi } from "../../../../lib/firebase/categories";
import { useAuth } from "../../../../components/providers/AuthProvider";
import { isAdminEmail } from "../../../../lib/admin";
import { splitCatalogByType } from "../../../../lib/catalog";
import {
  firstLinkUrl,
  linksToFirestorePayload,
  normalizeOfferLinks,
  type OfferLinkItem,
} from "../../../../lib/offerLinks";
import { normalizeOfferCategories, normalizeOfferStores, resolveCategoryLabels } from "../../../../lib/offerCategories";
import type { Category } from "../../../../lib/types";

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

function linksFormFromFirestore(v: Record<string, unknown>): OfferLinkForm[] {
  const n = normalizeOfferLinks(v);
  if (n.length === 0) return [emptyLinkRow()];
  return n.map((x) => ({
    title: x.title,
    description: x.description ?? "",
    url: x.url,
    type: (x.type ?? "") as LinkTypeOpt,
  }));
}

type Offer = {
  id: string;
  title: string;
  description: string;
  /** Libellé legacy (première catégorie ou texte historique) */
  category: string;
  /** Thèmes (types) */
  categories: string[];
  /** Enseignes */
  stores: string[];
  linkRows: OfferLinkForm[];
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  expiresAt?: string;
  favoritesCount?: number;
};

const emptyForm: Omit<Offer, "id"> = {
  title: "",
  description: "",
  category: "Autre",
  categories: [],
  stores: [],
  linkRows: [emptyLinkRow()],
  imageUrl: "",
  isActive: true,
  isFeatured: false,
  expiresAt: "",
  favoritesCount: 0,
};

export default function AdminOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  /** True si users/{uid}.role == admin (aligné règles Firebase) */
  const [firestoreAdminRole, setFirestoreAdminRole] = useState<boolean | null>(null);

  const [form, setForm] = useState<Omit<Offer, "id">>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);

  const { themes: themeOptions, stores: storeOptions } = useMemo(
    () => splitCatalogByType(categoryOptions),
    [categoryOptions]
  );

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.description.trim().length > 0;
  }, [form.title, form.description]);

  async function loadOffers() {
    setLoading(true);
    const q = query(collection(db, "offers"));
    const snap = await getDocs(q);

    const data = snap.docs.map((d) => {
      const v = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        title: (v.title as string) ?? "",
        description: (v.description as string) ?? "",
        category: (v.category as string) ?? "Autre",
        categories: normalizeOfferCategories(v),
        stores: normalizeOfferStores(v),
        linkRows: linksFormFromFirestore(v),
        imageUrl: (v.imageUrl as string) ?? "",
        isActive: !!v.isActive,
        isFeatured: !!v.isFeatured,
        favoritesCount: (v.favoritesCount as number) ?? 0,
        expiresAt:
          v.expiresAt && typeof (v.expiresAt as { toDate?: () => Date }).toDate === "function"
            ? (v.expiresAt as { toDate: () => Date }).toDate().toISOString().slice(0, 10)
            : "",
      };
    });

    setOffers(data);
    setLoading(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
  }

  function mapStorageError(code?: string) {
    if (code === "storage/unauthorized") {
      return "Upload refusé : compte non reconnu comme admin côté Firebase (claims ou users/{uid}.role).";
    }
    if (code === "storage/canceled") {
      return "Upload annulé.";
    }
    return "Upload image impossible (réseau ou quota).";
  }

  function mapFirestoreError(code?: string) {
    if (code === "permission-denied") {
      return "Écriture refusée : ton compte n’a pas le rôle admin côté Firebase (custom claims ou document users/{uid} avec role: \"admin\").";
    }
    return "Enregistrement Firestore impossible.";
  }

  async function uploadOfferImage(file: File) {
    const uid = user?.uid ?? "anonymous";
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `offers/${uid}/${Date.now()}_${safeName}`;
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, path);
    try {
      await uploadBytes(storageRef, file, { contentType: file.type });
      return getDownloadURL(storageRef);
    } catch (e) {
      console.error("[storage] admin offer upload failed", { op: "offer-image", path }, e);
      throw e;
    }
  }

  useEffect(() => {
    loadOffers().catch(console.error);
  }, []);

  useEffect(() => {
    fetchCategoriesForUi(db)
      .then(setCategoryOptions)
      .catch(() => setCategoryOptions([]));
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setFirestoreAdminRole(null);
      return;
    }
    const refUser = doc(db, "users", user.uid);
    getDoc(refUser)
      .then((snap) => {
        const role = snap.exists() ? (snap.data() as { role?: string }).role : undefined;
        setFirestoreAdminRole(role === "admin");
      })
      .catch(() => setFirestoreAdminRole(false));
  }, [user?.uid]);

  async function createOffer() {
    if (!canSubmit) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const fileUrl = imageFile ? await uploadOfferImage(imageFile) : null;
      const expiresAtValue = form.expiresAt
        ? Timestamp.fromDate(new Date(`${form.expiresAt}T23:59:59`))
        : null;

      const linkItems = linksToFirestorePayload(
        form.linkRows.map((r) => ({
          title: r.title,
          description: r.description.trim() || undefined,
          url: r.url,
          type: r.type || undefined,
        }))
      );
      const primaryUrl = firstLinkUrl(linkItems);
      const primaryLabel =
        form.categories
          .map((id) => categoryOptions.find((c) => c.id === id)?.name)
          .find((n) => n && n.trim()) ??
        form.categories[0] ??
        "Autre";
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categories: form.categories,
        stores: form.stores,
        category: typeof primaryLabel === "string" ? primaryLabel : "Autre",
        links: linkItems,
        link: primaryUrl,
        imageUrl: (fileUrl ?? form.imageUrl).trim(),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        expiresAt: expiresAtValue,
        favoritesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!payload.imageUrl) {
        setError("Ajoute une image (fichier ou URL).");
        return;
      }

      await addDoc(collection(db, "offers"), payload);
      resetForm();
      setSuccess("Offre ajoutée avec succès.");
      await loadOffers();
    } catch (err: unknown) {
      if (err instanceof FirebaseError && err.code?.startsWith("storage/")) {
        setError(mapStorageError(err.code));
      } else if (err instanceof FirebaseError) {
        console.error("[admin offers] Firestore create", err);
        setError(mapFirestoreError(err.code));
      } else {
        console.error("[admin offers] Firestore create", err);
        setError("Création impossible.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editingId || !canSubmit) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const fileUrl = imageFile ? await uploadOfferImage(imageFile) : null;
      const expiresAtValue = form.expiresAt
        ? Timestamp.fromDate(new Date(`${form.expiresAt}T23:59:59`))
        : null;

      const linkItems = linksToFirestorePayload(
        form.linkRows.map((r) => ({
          title: r.title,
          description: r.description.trim() || undefined,
          url: r.url,
          type: r.type || undefined,
        }))
      );
      const primaryUrl = firstLinkUrl(linkItems);
      const imageFinal = (fileUrl ?? form.imageUrl).trim();
      if (!imageFinal) {
        setError("Ajoute une image (fichier ou URL).");
        return;
      }

      const primaryLabel =
        form.categories
          .map((id) => categoryOptions.find((c) => c.id === id)?.name)
          .find((n) => n && n.trim()) ??
        form.categories[0] ??
        "Autre";

      await updateDoc(doc(db, "offers", editingId), {
        title: form.title.trim(),
        description: form.description.trim(),
        categories: form.categories,
        stores: form.stores,
        category: typeof primaryLabel === "string" ? primaryLabel : "Autre",
        links: linkItems,
        link: primaryUrl,
        imageUrl: imageFinal,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        expiresAt: expiresAtValue,
        updatedAt: serverTimestamp(),
      });

      resetForm();
      setSuccess("Offre modifiée avec succès.");
      await loadOffers();
    } catch (err: unknown) {
      if (err instanceof FirebaseError && err.code?.startsWith("storage/")) {
        setError(mapStorageError(err.code));
      } else if (err instanceof FirebaseError) {
        console.error("[admin offers] Firestore update", err);
        setError(mapFirestoreError(err.code));
      } else {
        console.error("[admin offers] Firestore update", err);
        setError("Modification impossible.");
      }
    } finally {
      setSaving(false);
    }
  }

  function startEdit(o: Offer) {
    setEditingId(o.id);
    setForm({
      title: o.title,
      description: o.description,
      category: o.category,
      categories: o.categories.length ? [...o.categories] : [],
      stores: o.stores.length ? [...o.stores] : [],
      linkRows: o.linkRows.length ? o.linkRows.map((r) => ({ ...r })) : [emptyLinkRow()],
      imageUrl: o.imageUrl,
      isActive: o.isActive,
      isFeatured: o.isFeatured,
      expiresAt: o.expiresAt ?? "",
      favoritesCount: o.favoritesCount ?? 0,
    });
    setImageFile(null);
    setImagePreview(o.imageUrl ?? "");
  }

  function cancelEdit() {
    resetForm();
  }

  async function removeOffer(id: string) {
    await deleteDoc(doc(db, "offers", id));
    await loadOffers();
  }

  async function toggleActive(o: Offer) {
    await updateDoc(doc(db, "offers", o.id), {
      isActive: !o.isActive,
      updatedAt: serverTimestamp(),
    });
    await loadOffers();
  }

  async function toggleFeatured(o: Offer) {
    await updateDoc(doc(db, "offers", o.id), {
      isFeatured: !o.isFeatured,
      updatedAt: serverTimestamp(),
    });
    await loadOffers();
  }

  const showClaimsHint =
    user &&
    firestoreAdminRole === false &&
    isAdminEmail(user.email ?? null);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Admin • Offres</h1>

      {showClaimsHint ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100">
          Accès UI via email admin, mais Firebase exige aussi{" "}
          <strong>custom claims</strong> ou le document{" "}
          <code className="rounded bg-white/60 px-1 dark:bg-black/30">users/{`{uid}`}.role = &quot;admin&quot;</code>{" "}
          pour écrire dans Firestore / Storage. Sans ça, création et upload échouent.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold mb-3">
          {editingId ? "Modifier une offre" : "Ajouter une offre"}
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Titre
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </label>

          <div className="text-sm md:col-span-2">
            <span className="font-medium">Thèmes (catégories)</span>
            <p className="mb-2 mt-1 text-xs text-slate-500">
              Types d’offre (beauté, alimentaire…). Les entrées « enseigne » sont cochées plus bas.
            </p>
            <div className="flex max-h-48 flex-wrap gap-x-4 gap-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-600">
              {themeOptions.length === 0 ? (
                <span className="text-xs text-slate-500">
                  Aucun thème (catégories sans type « enseigne », ou mock).
                </span>
              ) : (
                themeOptions.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={form.categories.includes(c.id)}
                      onChange={() => {
                        setForm((f) => {
                          const next = new Set(f.categories);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return { ...f, categories: [...next] };
                        });
                      }}
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="text-sm md:col-span-2">
            <span className="font-medium">Enseignes</span>
            <p className="mb-2 mt-1 text-xs text-slate-500">
              Marques / magasins — créez des catégories avec type « Enseigne » dans Admin → Catégories.
            </p>
            <div className="flex max-h-48 flex-wrap gap-x-4 gap-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-600">
              {storeOptions.length === 0 ? (
                <span className="text-xs text-slate-500">Aucune enseigne définie (type « store »).</span>
              ) : (
                storeOptions.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={form.stores.includes(c.id)}
                      onChange={() => {
                        setForm((f) => {
                          const next = new Set(f.stores);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return { ...f, stores: [...next] };
                        });
                      }}
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <label className="text-sm md:col-span-2">
            Description
            <textarea
              className="mt-1 w-full rounded-xl border p-2"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>

          <div className="text-sm md:col-span-2 grid gap-3">
            <div>
              <span className="font-medium">Liens (cartes)</span>
              <p className="mt-1 text-xs text-slate-500">
                Chaque entrée = titre + URL + optionnel description et type. Le champ{" "}
                <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">link</code> conserve le 1er
                URL (compat).
              </p>
            </div>
            {form.linkRows.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-600 md:grid-cols-2"
              >
                <label className="text-xs font-medium md:col-span-2">
                  Titre
                  <input
                    className="mt-1 w-full rounded-lg border p-2 text-sm"
                    placeholder="Coupon immédiat"
                    value={row.title}
                    onChange={(e) => {
                      const next = [...form.linkRows];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setForm((f) => ({ ...f, linkRows: next }));
                    }}
                  />
                </label>
                <label className="text-xs font-medium md:col-span-2">
                  URL
                  <input
                    className="mt-1 w-full rounded-lg border p-2 text-sm"
                    placeholder="https://..."
                    value={row.url}
                    onChange={(e) => {
                      const next = [...form.linkRows];
                      next[idx] = { ...next[idx], url: e.target.value };
                      setForm((f) => ({ ...f, linkRows: next }));
                    }}
                  />
                </label>
                <label className="text-xs font-medium md:col-span-2">
                  Description courte (optionnel)
                  <input
                    className="mt-1 w-full rounded-lg border p-2 text-sm"
                    value={row.description}
                    onChange={(e) => {
                      const next = [...form.linkRows];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setForm((f) => ({ ...f, linkRows: next }));
                    }}
                  />
                </label>
                <label className="text-xs font-medium">
                  Type
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                    value={row.type}
                    onChange={(e) => {
                      const next = [...form.linkRows];
                      next[idx] = { ...next[idx], type: e.target.value as LinkTypeOpt };
                      setForm((f) => ({ ...f, linkRows: next }));
                    }}
                  >
                    <option value="">—</option>
                    <option value="coupon">Coupon</option>
                    <option value="odr">ODR</option>
                    <option value="shop">Magasin / shop</option>
                    <option value="other">Autre</option>
                  </select>
                </label>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-2 text-xs"
                    disabled={form.linkRows.length <= 1}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        linkRows: f.linkRows.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-fit"
              onClick={() => setForm((f) => ({ ...f, linkRows: [...f.linkRows, emptyLinkRow()] }))}
            >
              + Ajouter un lien
            </button>
          </div>

          <label className="text-sm md:col-span-2">
            Image (fichier ou URL)
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (!f) return;
                if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)) {
                  setError("Format image non supporte (jpg, jpeg, png, webp).");
                  return;
                }
                setError(null);
                setImageFile(f);
                setImagePreview(URL.createObjectURL(f));
              }}
              className={`mt-1 rounded-xl border border-dashed p-4 text-sm ${
                dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300"
              }`}
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)) {
                    setError("Format image non supporte (jpg, jpeg, png, webp).");
                    return;
                  }
                  setError(null);
                  setImageFile(f);
                  setImagePreview(URL.createObjectURL(f));
                }}
              />
              <p className="mt-2 text-xs text-slate-500">Tu peux aussi glisser-deposer une image ici.</p>
            </div>
            <input
              className="mt-2 w-full rounded-xl border p-2"
              placeholder="Ou URL image existante"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Apercu" className="mt-2 h-28 w-40 rounded-xl object-cover border" />
            ) : null}
          </label>

          <label className="text-sm">
            Date de fin
            <input
              type="date"
              className="mt-1 w-full rounded-xl border p-2"
              value={form.expiresAt ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </label>

          <div className="flex items-center gap-4 pt-4">
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              Active
            </label>

            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isFeatured: e.target.checked }))
                }
              />
              Featured
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {!editingId ? (
            <button
              disabled={!canSubmit || saving}
              onClick={createOffer}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
            >
              {saving ? "Ajout..." : "Ajouter"}
            </button>
          ) : (
            <>
              <button
                disabled={saving}
                onClick={saveEdit}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-xl border px-4 py-2"
              >
                Annuler
              </button>
            </>
          )}
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="font-semibold mb-3">Liste des offres</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : (
          <div className="grid gap-3">
            {offers.map((o) => {
              const catLabels = resolveCategoryLabels(o.categories, categoryOptions);
              const storeLabels = resolveCategoryLabels(o.stores, categoryOptions);
              const catLine =
                [catLabels.join(" · "), storeLabels.join(" · ")].filter(Boolean).join(" • ") ||
                o.category;
              return (
              <div key={o.id} className="rounded-xl border p-3">
                <div className="font-semibold">{o.title}</div>
                <div className="text-xs text-slate-500">
                  {catLine} • active: {String(o.isActive)} • featured:{" "}
                  {String(o.isFeatured)} • favs: {o.favoritesCount ?? 0}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => startEdit(o)}
                    className="rounded-lg border px-3 py-1 text-xs"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleActive(o)}
                    className="rounded-lg border px-3 py-1 text-xs"
                  >
                    {o.isActive ? "Desactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => toggleFeatured(o)}
                    className="rounded-lg border px-3 py-1 text-xs"
                  >
                    {o.isFeatured ? "Retirer top" : "Mettre top"}
                  </button>
                  <button
                    onClick={() => removeOffer(o.id)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
