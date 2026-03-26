"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { LinkButton } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";

import { categories } from "../../lib/mock";
import { BRAND_NAME } from "../../lib/brand";
import { db } from "../../lib/firebase/client";
import {
  isOfferExpired,
  isOfferPubliclyActive,
  sortTopByFavoritesThenRecent,
} from "../../lib/offersDisplay";

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
  "inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-300";

export default function HomePage() {
  const [topOffers, setTopOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      setLoading(true);

      try {
        const snap = await getDocs(collection(db, "offers"));

        const raw: Offer[] = snap.docs.map((d) => {
          const v = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            title: (v.title as string) ?? "",
            description: (v.description as string) ?? "",
            partner: (v.partner as string) ?? "",
            imageUrl: (v.imageUrl as string) ?? "",
            category: (v.category as string) ?? "",
            link: (v.link as string) ?? "",
            isActive: typeof v.isActive === "boolean" ? v.isActive : undefined,
            isFeatured: !!v.isFeatured,
            favoritesCount: (v.favoritesCount as number) ?? 0,
            expiresAt: v.expiresAt,
            badge: v.badge as string | undefined,
            createdAt: v.createdAt as Offer["createdAt"],
          };
        });

        const active = raw.filter(
          (o) => isOfferPubliclyActive(o) && !isOfferExpired(o.expiresAt)
        );
        const sorted = sortTopByFavoritesThenRecent(active);
        setTopOffers(sorted.slice(0, 6));
      } catch (e) {
        console.error(e);
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
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6">
          <Badge variant="success">Nouveau sur {BRAND_NAME}</Badge>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Bons plans, réductions à combiner, opportunités en magasin.
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-300">
            {BRAND_NAME} sélectionne des offres avantageuses pour payer moins cher en magasin, parfois
            beaucoup moins — selon les conditions indiquées par chaque enseigne.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/offers">Voir les offres</LinkButton>
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

        <Card className="flex flex-col items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-emerald-600">Les plus ajoutées en favoris</p>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Ce qui intéresse le plus les utilisateurs
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Classement basé sur le nombre de favoris, puis sur les offres les plus récentes en cas d’égalité.
            </p>
          </div>

          <div className="grid w-full gap-3">
            {loading ? (
              <p className="text-sm text-slate-500">Chargement…</p>
            ) : smartRanking.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Aucune offre disponible pour le moment. De nouvelles opportunités seront bientôt proposées.
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
                    <p className="text-xs text-slate-500">
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

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Offres les plus mises en favoris
          </h2>

          <Link href="/offers" className="text-sm font-semibold text-emerald-600">
            Tout voir
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : topOffers.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Aucune offre disponible pour le moment. Revenez bientôt ou parcourez les catégories ci-dessus.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {topOffers.map((offer) => {
              const b = computeBadge(offer);
              const exp = formatExpiryLabel(offer.expiresAt);
              return (
                <Card key={offer.id} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={badgeVariant(b)}>{b}</Badge>
                    <span className="text-xs text-slate-500">{exp ? `Fin ${exp}` : ""}</span>
                  </div>

                  <Image
                    src={safeImageSrc(offer.imageUrl)}
                    alt={`Illustration ${offer.title}`}
                    width={640}
                    height={360}
                    className="h-40 w-full rounded-2xl object-cover"
                  />

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{offer.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{offer.description}</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-semibold text-slate-500">
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

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <Badge variant="info">Comment ça marche</Badge>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Trois étapes pour profiter des offres
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Repérez une offre",
              text: "Parcourez les bons plans, filtrez par catégorie et enregistrez vos favoris.",
            },
            {
              title: "En magasin ou en ligne",
              text: "Profitez des conditions indiquées sur le lieu de vente ou le site marchand.",
            },
            {
              title: "Suivez vos demandes",
              text: "Ticket de caisse, validation : un suivi clair des étapes sur votre compte.",
            },
          ].map((step) => (
            <Card key={step.title} className="bg-slate-50 dark:bg-slate-950">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
