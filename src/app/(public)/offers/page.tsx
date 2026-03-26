"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Chip";
import { Input } from "../../../components/ui/Input";

import { db } from "../../../lib/firebase/client";
import { fetchPublicOffersResult } from "../../../lib/firebase/publicOffers";
import { OfferCardSkeleton } from "../../../components/ui/Skeleton";
import { categories } from "../../../lib/mock";
import { filterAndSortOffers, isOfferExpired } from "../../../lib/offersDisplay";

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
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && categories.some((c) => c.id === cat)) {
      setCategoryFilter(cat);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchOffers() {
      setLoading(true);
      setError(null);

      const result = await fetchPublicOffersResult(db);

      if (cancelled) return;

      if (result.status === "error") {
        console.error("[Offera] catalogue:", result.kind, result.message);
        setError(result.message);
        setOffers([]);
        setLoading(false);
        return;
      }

      const data = result.docs.map((docSnap) => ({
        ...(docSnap.data() as Record<string, unknown>),
        id: docSnap.id,
      })) as Offer[];

      const activeAndNotExpired = data.filter((o) => !isOfferExpired(o.expiresAt));

      setOffers(activeAndNotExpired);
      setLoading(false);
    }

    fetchOffers().catch((e) => {
      console.error(e);
      if (!cancelled) {
        setError("Impossible de charger le catalogue. Réessayez.");
        setOffers([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

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
    <div className="flex flex-col gap-8 sm:gap-10">
      <header className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Catalogue
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Offres
          </h1>
          <p className="mt-2 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            Bons plans en magasin et en ligne : recherche, catégories, tri par pertinence puis popularité.
          </p>
        </div>

        <Link href={suggestHref} className="shrink-0 self-start sm:self-auto">
          <Button className="w-full min-[400px]:w-auto">Suggérer une offre</Button>
        </Link>
      </header>

      <Card className="grid gap-4 p-4 sm:p-6">
        <Input
          label="Recherche"
          placeholder="Enseigne, produit, mot-clé…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Catégories
          </p>
          <div className="flex flex-wrap gap-2">
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
      </Card>

      {loading && (
        <div
          className="grid gap-5 sm:grid-cols-2"
          aria-busy
          aria-label="Chargement du catalogue"
        >
          <OfferCardSkeleton />
          <OfferCardSkeleton />
          <OfferCardSkeleton />
          <OfferCardSkeleton />
        </div>
      )}

      {!loading && error && (
        <Card className="border border-red-200/90 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-950 dark:text-red-100">
                Impossible d’afficher le catalogue
              </p>
              <p className="mt-2 text-sm leading-relaxed text-red-900 dark:text-red-200/95">{error}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 self-start border-red-200 bg-white text-red-900 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
              onClick={() => setRetryKey((k) => k + 1)}
            >
              Réessayer
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && offers.length === 0 && (
        <Card className="border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Aucune offre publiée pour l’instant</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Revenez bientôt ou proposez une offre via le bouton en haut de page.
          </p>
        </Card>
      )}

      {!loading && !error && emptyBecauseFilter && (
        <Card className="p-8">
          <p className="text-center text-sm font-semibold text-slate-900 dark:text-white">
            Aucun résultat pour ces critères
          </p>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Élargissez la recherche ou réinitialisez les filtres.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="secondary" type="button" onClick={() => setSearch("")}>
              Effacer la recherche
            </Button>
            <Button type="button" onClick={() => setCategory(null)}>
              Afficher toutes les catégories
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && displayed.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
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
              <Card
                key={offer.id}
                className="group flex flex-col gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-slate-900/5 hover:ring-1 hover:ring-emerald-200/60 active:translate-y-0 active:shadow-md dark:hover:shadow-none dark:hover:ring-emerald-800/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Badge variant={offer.isFeatured ? "info" : "success"}>
                    {offer.isFeatured ? "À la une" : "Bonne affaire"}
                  </Badge>

                  <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleFav(String(offer.id))}
                      disabled={busy}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500/50"
                      title="Favoris"
                    >
                      {isFav ? "En favori" : "Favori"} · {favCount}
                    </button>
                    {exp ? (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Fin {exp}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
                  <img
                    src={imgSrc}
                    alt={`Visuel : ${offer.title ?? "Offre"}`}
                    className="aspect-[16/10] h-auto w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[1.01]"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder-offer.png";
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white">
                    {offer.title ?? "Sans titre"}
                  </h2>
                  {offer.partner ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      {offer.partner}
                    </p>
                  ) : null}
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {offer.description ?? ""}
                  </p>
                </div>

                <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {offer.category ?? "Autre"}
                  </span>

                  <Link
                    href={`/offers/${encodeURIComponent(String(offer.id))}`}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-500 hover:shadow-md active:scale-[0.99] sm:w-auto"
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
