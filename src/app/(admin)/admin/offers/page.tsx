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
import { useAuth } from "../../../../components/providers/AuthProvider";
import { isAdminEmail } from "../../../../lib/admin";

type Offer = {
  id: string;
  title: string;
  description: string;
  category: string;
  /** URLs uniquement — compat anciennes offres : on garde aussi `link` à l’écriture */
  links: string[];
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  expiresAt?: string;
  favoritesCount?: number;
};

const emptyForm: Omit<Offer, "id"> = {
  title: "",
  description: "",
  category: "Tech",
  links: [""],
  imageUrl: "",
  isActive: true,
  isFeatured: false,
  expiresAt: "",
  favoritesCount: 0,
};

/** Normalise Firestore -> liste d’URLs (string[] ou ancien format {label,url}) */
function linksFromFirestore(v: Record<string, unknown>): string[] {
  const raw = v.links;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [""];
    if (typeof raw[0] === "string") {
      return raw.map((s) => String(s).trim()).filter(Boolean);
    }
    return (raw as { url?: string }[])
      .map((x) => (x?.url ?? "").trim())
      .filter(Boolean);
  }
  const single = typeof v.link === "string" ? v.link.trim() : "";
  return single ? [single] : [""];
}

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

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.description.trim().length > 0;
  }, [form.title, form.description]);

  async function loadOffers() {
    setLoading(true);
    const q = query(collection(db, "offers"));
    const snap = await getDocs(q);

    const data = snap.docs.map((d) => {
      const v = d.data() as Record<string, unknown>;
      const linkList = linksFromFirestore(v);
      return {
        id: d.id,
        title: (v.title as string) ?? "",
        description: (v.description as string) ?? "",
        category: (v.category as string) ?? "Autre",
        links: linkList.length ? linkList : [""],
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

      const linksClean = form.links.map((u) => u.trim()).filter(Boolean);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "Autre",
        links: linksClean,
        link: linksClean[0] ?? "",
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

      const linksClean = form.links.map((u) => u.trim()).filter(Boolean);
      const imageFinal = (fileUrl ?? form.imageUrl).trim();
      if (!imageFinal) {
        setError("Ajoute une image (fichier ou URL).");
        return;
      }

      await updateDoc(doc(db, "offers", editingId), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "Autre",
        links: linksClean,
        link: linksClean[0] ?? "",
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
      links: o.links.length ? [...o.links] : [""],
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

          <label className="text-sm">
            Catégorie
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            />
          </label>

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

          <div className="text-sm md:col-span-2 grid gap-2">
            <span className="font-medium">Liens (plusieurs URLs)</span>
            <p className="text-xs text-slate-500">
              Stockage Firestore : <code className="rounded bg-slate-100 px-1">links</code> (tableau
              d’URLs) + <code className="rounded bg-slate-100 px-1">link</code> = premier lien (compat).
            </p>
            {form.links.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => {
                    const next = [...form.links];
                    next[idx] = e.target.value;
                    setForm((f) => ({ ...f, links: next }));
                  }}
                />
                <button
                  type="button"
                  className="mt-1 shrink-0 rounded-xl border px-3 py-2 text-xs"
                  disabled={form.links.length <= 1}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      links: f.links.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Retirer
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm w-fit"
              onClick={() => setForm((f) => ({ ...f, links: [...f.links, ""] }))}
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
            {offers.map((o) => (
              <div key={o.id} className="rounded-xl border p-3">
                <div className="font-semibold">{o.title}</div>
                <div className="text-xs text-slate-500">
                  {o.category} • active: {String(o.isActive)} • featured:{" "}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
