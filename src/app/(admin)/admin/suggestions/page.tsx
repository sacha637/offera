"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { Input } from "../../../../components/ui/Input";
import { db } from "../../../../lib/firebase/client";

type SuggestionStatus = "pending" | "approved" | "rejected" | "needs_info";

type Suggestion = {
  id: string;

  title?: string;
  partner?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  links?: string[];
  promoCode?: string;

  userId?: string;
  status?: SuggestionStatus;
  offerId?: string | null;

  createdAt?: any;
  updatedAt?: any;
};

function formatDate(ts: any) {
  try {
    if (!ts) return "—";
    const dt = ts?.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  } catch {
    return "—";
  }
}

export default function AdminSuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [tab, setTab] = useState<SuggestionStatus>("pending");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "offerSuggestions"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Suggestion[];
      setItems(data);
    } catch (e) {
      console.error("Erreur load suggestions:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return items
      .filter((x) => (x.status ?? "pending") === tab)
      .filter((x) => {
        if (!s) return true;
        const hay = `${x.title ?? ""} ${x.partner ?? ""} ${x.category ?? ""} ${
          x.description ?? ""
        } ${(x.links ?? []).join(" ")}`.toLowerCase();
        return hay.includes(s);
      });
  }, [items, tab, search]);

  async function setStatus(id: string, status: SuggestionStatus) {
    setBusyId(id);
    try {
      await updateDoc(doc(db, "offerSuggestions", id), {
        status,
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch (e) {
      console.error("Erreur setStatus:", e);
    } finally {
      setBusyId(null);
    }
  }

  async function transformToOffer(s: Suggestion) {
    const title = s.title?.trim();
    const partner = s.partner?.trim();
    if (!title || !partner) return;

    setBusyId(s.id);
    try {
      const links = (s.links ?? []).map((x) => String(x).trim()).filter(Boolean);

      // 1) créer l'offre (compatible avec ton modèle : link + links optionnels)
      const offerRef = await addDoc(collection(db, "offers"), {
        title,
        partner,
        description: (s.description ?? "").trim(),
        category: (s.category ?? "Autre") || "Autre",

        link: links[0] ?? "",
        links: links.map((url) => ({ label: "Lien", url })),

        imageUrl: (s.imageUrl ?? "").trim(),
        promoCode: (s.promoCode ?? "").trim(),

        isActive: true,
        isFeatured: false,
        favoritesCount: 0,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2) marquer suggestion approuvée + lier offerId
      await updateDoc(doc(db, "offerSuggestions", s.id), {
        status: "approved",
        offerId: offerRef.id,
        updatedAt: serverTimestamp(),
      });

      await load();
    } catch (e) {
      console.error("Erreur transformToOffer:", e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suggestions</h1>
          <p className="text-sm text-slate-600">
            Gère les suggestions envoyées par les utilisateurs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={tab === "pending" ? undefined : "secondary"}
            onClick={() => setTab("pending")}
          >
            En attente
          </Button>
          <Button
            variant={tab === "needs_info" ? undefined : "secondary"}
            onClick={() => setTab("needs_info")}
          >
            Needs info
          </Button>
          <Button
            variant={tab === "approved" ? undefined : "secondary"}
            onClick={() => setTab("approved")}
          >
            Approuvées
          </Button>
          <Button
            variant={tab === "rejected" ? undefined : "secondary"}
            onClick={() => setTab("rejected")}
          >
            Rejetées
          </Button>

          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Chargement…" : "Rafraîchir"}
          </Button>
        </div>
      </div>

      <Input
        label="Recherche"
        placeholder="Titre, partenaire, catégorie, description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-slate-600">Aucune suggestion ici.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => {
            const status = (s.status ?? "pending") as SuggestionStatus;
            const busy = busyId === s.id;
            const links = (s.links ?? []).map((x) => String(x).trim()).filter(Boolean);

            return (
              <Card key={s.id} className="grid gap-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {s.title ?? "Sans titre"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {s.partner ?? "—"} • {s.category ?? "Autre"} • {formatDate(s.createdAt)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {/* ✅ pas de variant="secondary" sur Badge */}
                      <Badge>{status}</Badge>
                      {s.offerId ? <Badge variant="info">OfferId: {s.offerId}</Badge> : null}
                      {s.userId ? <Badge>User: {s.userId}</Badge> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled={busy} onClick={() => setStatus(s.id, "approved")}>
                      Approve
                    </Button>

                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setStatus(s.id, "needs_info")}
                    >
                      Needs info
                    </Button>

                    {/* ✅ pas de variant="danger" : on force rouge via className */}
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setStatus(s.id, "rejected")}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                {s.description ? (
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{s.description}</p>
                ) : null}

                {links.length ? (
                  <div className="grid gap-1">
                    {links.slice(0, 5).map((l, idx) => (
                      <a
                        key={idx}
                        href={l}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        {l}
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    {s.promoCode ? (
                      <>
                        Code promo: <span className="font-semibold">{s.promoCode}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    disabled={busy || status === "rejected"}
                    onClick={() => transformToOffer(s)}
                  >
                    {busy ? "Transformation…" : "Transformer en offre"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}