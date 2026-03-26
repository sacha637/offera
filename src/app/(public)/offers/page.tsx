"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { Input } from "../../../components/ui/Input";

import { db } from "../../../lib/firebase/client";
import { categories } from "../../../lib/mock";
import {
  filterAndSortOffers,
  isOfferExpired,
  isOfferPubliclyActive,
} from "../../../lib/offersDisplay";

import { useAuth } from "../../../components/providers/AuthProvider";
import { isOfferFavorited, toggleFavorite } from "../../../lib/firebase/favorites";

type Offer = {
  id: string;
  title?: string;
  partner?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  link?: string;
  links?: { label: string; url: string }[];
  isFeatured?: boolean;
  isActive?: boolean;
  favoritesCount?: number;
  createdAt?: { toMillis?: () => number };
  expiresAt?: unknown;
};

function formatExpiry(expiresAt: unknown) {
  if (!expiresAt) return null;
  if (typeof (expiresAt as { toDate?: () => Date }).toDate === "function") {
    return (expiresAt as { toDate: () => Date }).toDate().toLocaleDateString("fr-FR");
  }
  if (typeof expiresAt === "string" && expiresAt.trim()) {
    return new Date(`${expiresAt}T12:00:00`).toLocaleDateString("fr-FR");
  }
  return null;
}

export default function OffersPage() {
  const { user } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [favMap, setFavMap] = useState<Record<string, boolean>>({});
  const [favBusyId, setFavBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && categories.some((c) => c.id === cat)) {
      setCategoryFilter(cat);
    }
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);

      try {
        const snapshot = await getDocs(collection(db, "offers"));

        const data = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as Record<string, unknown>),
          id: docSnap.id,
        })) as Offer[];

        const activeAndNotExpired = data.filter(
          (o) => isOfferPubliclyActive(o) && !isOfferExpired(o.expiresAt)
        );

        setOffers(activeAndNotExpired);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur de chargement.";
        console.error("Erreur Firestore:", e);
        setError(msg);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  useEffect(() => {
    async function run() {
      if (!user?.uid) {
        setFavMap({});
        return;
      }

      const entries = await Promise.all(
        offers.map(async (o) => {
          const ok = await isOfferFavorited({ uid: user.uid, offerId: String(o.id) });
          return [String(o.id), ok] as const;
        })
      );

      const m: Record<string, boolean> = {};
      for (const [id, ok] of entries) m[id] = ok;
      setFavMap(m);
    }

    if (offers.length > 0) run().catch(console.error);
  }, [user?.uid, offers]);

  const displayed = useMemo(
    () =>
      filterAndSortOffers(offers, {
        search,
        categoryId: categoryFilter,
        categories,
      }),
    [offers, search, categoryFilter]
  );

  function setCategory(cat: string | null) {
    setCategoryFilter(cat);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (cat) url.searchParams.set("cat", cat);
    else url.searchParams.delete("cat");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  async function onToggleFav(offerId: string) {
    if (!user?.uid) {
      window.location.href = "/login";
      return;
    }

    setFavBusyId(offerId);
    try {
      const res = await toggleFavorite({ uid: user.uid, offerId });

      setFavMap((prev) => ({ ...prev, [offerId]: res.isFavorite }));

      setOffers((prev) =>
        prev.map((o) =>
          String(o.id) === offerId ? { ...o, favoritesCount: res.favoritesCount } : o
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setFavBusyId(null);
    }
  }

  const suggestHref = user?.uid ? "/offers/suggest" : "/login";

  const emptyBecauseFilter =
    !loading && !error && offers.length > 0 && displayed.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Offres</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Bons plans et réductions actives. Recherchez par mot-clé ou filtrez par catégorie.
          </p>
        </div>

        <Link href={suggestHref}>
          <Button>Proposer une offre</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        <Input
          label="Recherche"
          placeholder="Enseigne, produit, catégorie…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Catégories</p>
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={categoryFilter === null} type="button" onClick={() => setCategory(null)}>
              Toutes
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                active={categoryFilter === category.id}
                type="button"
                onClick={() => setCategory(category.id === categoryFilter ? null : category.id)}
              >
                {category.name}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="text-slate-500">Chargement des offres…</p>}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-800 dark:text-red-200">
            Impossible de charger les offres. Vérifiez votre connexion ou réessayez plus tard.
          </p>
        </Card>
      )}

      {!loading && !error && offers.length === 0 && (
        <Card className="p-8">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Aucune offre disponible pour le moment. Revenez bientôt.
          </p>
        </Card>
      )}

      {!loading && !error && emptyBecauseFilter && (
        <Card className="p-8">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Aucune offre ne correspond à votre recherche ou à cette catégorie. Modifiez les filtres ou
            effacez la recherche.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" type="button" onClick={() => setSearch("")}>
              Effacer la recherche
            </Button>
            <Button type="button" onClick={() => setCategory(null)}>
              Toutes les catégories
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && displayed.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {displayed.map((offer) => {
            const imgSrc =
              offer.imageUrl && offer.imageUrl.trim()
                ? offer.imageUrl.trim()
                : "/placeholder-offer.png";

            const isFav = !!favMap[String(offer.id)];
            const favCount = offer.favoritesCount ?? 0;
            const busy = favBusyId === String(offer.id);
            const exp = formatExpiry(offer.expiresAt);

            return (
              <Card key={offer.id} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
                  <Badge variant={offer.isFeatured ? "info" : "success"}>
                    {offer.isFeatured ? "À la une" : "Offre"}
                  </Badge>

                  <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleFav(String(offer.id))}
                      disabled={busy}
                      className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold dark:border-slate-600"
                      title="Favoris"
                    >
                      {isFav ? "Favori" : "Ajouter"} · {favCount}
                    </button>
                    {exp ? <span className="text-xs text-slate-500">Fin {exp}</span> : null}
                  </div>
                </div>

                <img
                  src={imgSrc}
                  alt={`Illustration ${offer.title ?? "Offre"}`}
                  className="h-40 w-full rounded-2xl object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder-offer.png";
                  }}
                />

                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {offer.title ?? "Sans titre"}
                  </h2>
                  {offer.partner ? (
                    <p className="text-xs font-semibold text-slate-500">{offer.partner}</p>
                  ) : null}
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                    {offer.description ?? ""}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{offer.category ?? "Autre"}</span>

                  <Link
                    href={`/offers/${encodeURIComponent(String(offer.id))}`}
                    className="font-semibold text-emerald-600 hover:underline"
                  >
                    Voir le détail
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
