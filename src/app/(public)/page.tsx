"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LinkButton } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";

import { categories } from "../../lib/mock";
import { BRAND_NAME } from "../../lib/brand";
import { db } from "../../lib/firebase/client";
import {
  fetchPublicActiveOffers,
  publicOffersErrorMessage,
} from "../../lib/firebase/publicOffers";
import { isOfferExpired, sortTopByFavoritesThenRecent } from "../../lib/offersDisplay";

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
  "inline-flex rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/40";

export default function HomePage() {
  const [topOffers, setTopOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setLoadError(null);

      try {
        const docs = await fetchPublicActiveOffers(db);

        const raw: Offer[] = docs.map((d) => {
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
        setTopOffers(sorted.slice(0, 6));
      } catch (e) {
        console.error(e);
        setLoadError(publicOffersErrorMessage(e));
        setTopOffers([]);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  const smartRanking = topOffers.slice(0, 3);

  return (
    <>
      {loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100"
        >
          <p className="font-semibold text-amber-950 dark:text-amber-50">Offres momentanément indisponibles</p>
          <p className="mt-1 leading-relaxed text-amber-900/95 dark:text-amber-100/90">{loadError}</p>
        </div>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div className="flex flex-col justify-center gap-5 sm:gap-6">
          <Badge variant="success">Nouveau sur {BRAND_NAME}</Badge>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Bons plans en magasin, réductions à combiner, offres limitées.
          </h1>

          <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg">
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
              <p className="text-sm font-medium text-slate-600">Chargement…</p>
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

      <section className="grid gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
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
          <p className="text-sm font-medium text-slate-600">Chargement…</p>
        ) : topOffers.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Aucune offre pour l’instant. Utilisez les catégories ci-dessus ou consultez le catalogue complet.
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {topOffers.map((offer) => {
              const b = computeBadge(offer);
              const exp = formatExpiryLabel(offer.expiresAt);
              return (
                <Card
                  key={offer.id}
                  className="flex flex-col gap-4 transition-shadow hover:shadow-md dark:hover:shadow-none"
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
                      className="aspect-[16/10] h-auto w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
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
