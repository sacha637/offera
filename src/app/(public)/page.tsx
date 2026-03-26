"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, LinkButton } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";

import { categories } from "../../lib/mock";
import { BRAND_NAME } from "../../lib/brand";
import { db } from "../../lib/firebase/client";
import { fetchPublicOffersResult } from "../../lib/firebase/publicOffers";
import { isOfferExpired, sortTopByFavoritesThenRecent } from "../../lib/offersDisplay";
import { OfferCardSkeleton, OfferRowSkeleton } from "../../components/ui/Skeleton";

type Offer = {
  id: string;
  title: string;
  description?: string;
  partner?: string;
  imageUrl?: string;
  category?: string;
  link?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  favoritesCount?: number;
  expiresAt?: unknown;
  badge?: string;
  createdAt?: { toMillis?: () => number };
};

function safeImageSrc(url?: string) {
  return url && url.trim().length > 0 ? url : "/images/offer-placeholder.svg";
}

function formatExpiryLabel(expiresAt: unknown) {
  if (!expiresAt) return "";
  if (typeof (expiresAt as { toDate?: () => Date }).toDate === "function") {
    return (expiresAt as { toDate: () => Date }).toDate().toLocaleDateString("fr-FR");
  }
  if (typeof expiresAt === "string" && expiresAt.trim()) {
    return new Date(`${expiresAt}T12:00:00`).toLocaleDateString("fr-FR");
  }
  return "";
}

function computeBadge(o: Offer) {
  if (o.badge) return o.badge;
  if (o.isFeatured) return "À la une";
  if ((o.favoritesCount ?? 0) >= 50) return "Populaire";
  return "Offre";
}

function badgeVariant(badge: string) {
  if (badge === "Expire bientôt") return "warning";
  if (badge === "À la une" || badge === "Featured") return "success";
  if (badge === "Populaire" || badge === "Top") return "info";
  return "info";
}

const chipLinkClass =
  "inline-flex rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-900";

export default function HomePage() {
  const [topOffers, setTopOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadError(null);

      const result = await fetchPublicOffersResult(db);

      if (cancelled) return;

      if (result.status === "error") {
        console.error("[Offera] offres publiques:", result.kind, result.message);
        setLoadError(result.message);
        setTopOffers([]);
        setLoading(false);
        return;
      }

      const raw: Offer[] = result.docs.map((d) => {
        const v = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          title: (v.title as string) ?? "",
          description: (v.description as string) ?? "",
          partner: (v.partner as string) ?? "",
          imageUrl: (v.imageUrl as string) ?? "",
          category: (v.category as string) ?? "",
          link: (v.link as string) ?? "",
          isActive: true,
          isFeatured: !!v.isFeatured,
          favoritesCount: (v.favoritesCount as number) ?? 0,
          expiresAt: v.expiresAt,
          badge: v.badge as string | undefined,
          createdAt: v.createdAt as Offer["createdAt"],
        };
      });

      const active = raw.filter((o) => !isOfferExpired(o.expiresAt));
      const sorted = sortTopByFavoritesThenRecent(active);
      if (cancelled) return;
      setTopOffers(sorted.slice(0, 6));
      setLoading(false);
    }

    run().catch((e) => {
      console.error(e);
      if (!cancelled) {
        setLoadError("Impossible de charger les offres. Réessayez.");
        setTopOffers([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const smartRanking = topOffers.slice(0, 3);

  return (
    <>
      {loadError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-amber-950">Offres momentanément indisponibles</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">{loadError}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0 self-start sm:self-auto"
            onClick={() => setRetryKey((k) => k + 1)}
          >
            Réessayer
          </Button>
        </div>
      ) : null}

      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div className="flex flex-col justify-center gap-5 sm:gap-6">
          <Badge variant="success" className="text-emerald-950">
            Nouveau sur {BRAND_NAME}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Bons plans en magasin, réductions à combiner, offres limitées.
          </h1>

          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
            {BRAND_NAME} met en avant des offres concrètes en point de vente : promos, codes et bons plans
            selon les conditions affichées par chaque enseigne.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/offers">Parcourir les offres</LinkButton>
            <LinkButton href="/tickets" variant="secondary">
              Envoyer un ticket
            </LinkButton>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.id} href={`/offers?cat=${encodeURIComponent(category.id)}`} className={chipLinkClass}>
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <Card className="flex flex-col items-start justify-between gap-6 border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/40 dark:border-emerald-900/30 dark:from-slate-900 dark:to-emerald-950/20">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Tendances
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Les plus enregistrées en favoris
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Classement par nombre de favoris, puis par date de publication si égalité.
            </p>
          </div>

          <div className="grid w-full gap-3">
            {loading ? (
              <div className="grid gap-4" aria-busy aria-label="Chargement des tendances">
                <OfferRowSkeleton />
                <OfferRowSkeleton />
                <OfferRowSkeleton />
              </div>
            ) : smartRanking.length === 0 ? (
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                Aucune offre à afficher pour le moment. Revenez bientôt ou ouvrez le catalogue complet.
              </p>
            ) : (
              smartRanking.map((offer) => (
                <div key={offer.id} className="flex items-center gap-4">
                  <div className="h-14 w-20 overflow-hidden rounded-2xl bg-emerald-100">
                    <Image
                      src={safeImageSrc(offer.imageUrl)}
                      alt={`Visuel ${offer.title}`}
                      width={80}
                      height={56}
                      className="h-14 w-20 rounded-2xl object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {offer.title}
                    </p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {offer.partner || "—"} · {offer.favoritesCount ?? 0} favori
                      {(offer.favoritesCount ?? 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Sélection
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Offres les plus suivies
            </h2>
          </div>

          <Link
            href="/offers"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Voir tout le catalogue →
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2" aria-busy aria-label="Chargement des offres">
            <OfferCardSkeleton />
            <OfferCardSkeleton />
            <OfferCardSkeleton />
            <OfferCardSkeleton />
          </div>
        ) : topOffers.length === 0 ? (
          <Card className="border-dashed border-slate-300 p-8 dark:border-slate-600">
            <p className="text-center text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
              Aucune offre pour l’instant. Parcourez les catégories ci-dessus ou ouvrez le catalogue complet.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {topOffers.map((offer) => {
              const b = computeBadge(offer);
              const exp = formatExpiryLabel(offer.expiresAt);
              return (
                <Card
                  key={offer.id}
                  className="group flex flex-col gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg hover:shadow-slate-900/5 hover:ring-emerald-100/80 active:translate-y-0 active:shadow-md dark:hover:shadow-none dark:hover:ring-emerald-900/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Badge variant={badgeVariant(b)}>{b}</Badge>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {exp ? `Jusqu’au ${exp}` : ""}
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700">
                    <Image
                      src={safeImageSrc(offer.imageUrl)}
                      alt={`Visuel : ${offer.title}`}
                      width={640}
                      height={360}
                      className="aspect-[16/10] h-auto w-full object-cover transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[1.01]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white">
                      {offer.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {offer.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {offer.partner || "—"} · {offer.favoritesCount ?? 0} favori
                      {(offer.favoritesCount ?? 0) > 1 ? "s" : ""}
                    </span>

                    <LinkButton
                      href={`/offers/${encodeURIComponent(String(offer.id))}`}
                      variant="secondary"
                      className="w-full shrink-0 sm:w-auto"
                    >
                      Voir l’offre
                    </LinkButton>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <Badge variant="info">Parcours</Badge>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trois étapes simples
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Un flux clair : repérer une offre, l’utiliser selon les règles du magasin, suivre vos éventuels
            échanges depuis votre compte.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Choisir une offre",
              text: "Filtrez par catégorie, recherchez une enseigne et enregistrez ce qui vous intéresse.",
            },
            {
              title: "En magasin ou sur le site marchand",
              text: "Appliquez les conditions affichées (dates, produits, magasins participants).",
            },
            {
              title: "Suivre vos demandes",
              text: "Si vous déposez un ticket ou une demande, retrouvez le statut depuis votre espace.",
            },
          ].map((step) => (
            <Card key={step.title} className="border-slate-100 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
