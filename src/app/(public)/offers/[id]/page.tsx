"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { Skeleton } from "../../../../components/ui/Skeleton";
import { db } from "../../../../lib/firebase/client";
import { isOfferExpired } from "../../../../lib/offersDisplay";
import { useAuth } from "../../../../components/providers/AuthProvider";

type OfferLink = {
  label: string;
  url: string;
};

type Offer = {
  id: string;

  title?: string;
  partner?: string;
  description?: string;
  category?: string;
  imageUrl?: string;

  link?: string;
  /** Ancien format {label,url} ou nouveau format string[] (URLs) */
  links?: OfferLink[] | string[];

  expiresAt?: any;
  isFeatured?: boolean;
  isActive?: boolean;

  qrEnabled?: boolean;
  promoCode?: string;

  favoritesCount?: number;
};

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const id = Array.isArray((params as any)?.id)
    ? (params as any).id[0]
    : (params as any)?.id;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  // Favoris
  const [favLoading, setFavLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchOffer = async () => {
      try {
        setLoading(true);

        const ref = doc(db, "offers", String(id));
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setOffer(null);
          setLoading(false);
          return;
        }

        setOffer({ ...(snap.data() as any), id: snap.id } as Offer);
        setLoading(false);
      } catch (e) {
        console.error("Erreur chargement offre:", e);
        setOffer(null);
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  // Vérifie si l'offre est déjà en favoris (si connecté)
  useEffect(() => {
    const checkFav = async () => {
      if (!user?.uid || !id) {
        setIsFav(false);
        return;
      }
      try {
        const favRef = doc(db, "users", user.uid, "favorites", String(id));
        const favSnap = await getDoc(favRef);
        setIsFav(favSnap.exists());
      } catch (e) {
        console.error("Erreur check favoris:", e);
        setIsFav(false);
      }
    };

    checkFav();
  }, [user?.uid, id]);

  const finalLinks: OfferLink[] = (() => {
    if (!offer?.links || !Array.isArray(offer.links) || offer.links.length === 0) {
      return offer?.link?.trim()
        ? [{ label: "Ouvrir l’offre", url: offer.link.trim() }]
        : [];
    }
    const first = offer.links[0];
    if (typeof first === "string") {
      return (offer.links as string[])
        .map((url, i) => ({ label: `Lien ${i + 1}`, url: url.trim() }))
        .filter((l) => l.url.length > 0);
    }
    return (offer.links as OfferLink[])
      .map((l) => ({
        label: (l?.label ?? "").trim(),
        url: (l?.url ?? "").trim(),
      }))
      .filter((l) => l.url.length > 0);
  })();

  const expired = offer ? isOfferExpired(offer.expiresAt) : false;

  const imgSrc =
    typeof offer?.imageUrl === "string" && offer.imageUrl.trim().length > 0
      ? offer.imageUrl.trim()
      : "/placeholder-offer.png";

  async function toggleFavorite() {
    if (!offer) return;

    // 🔒 Favoris = seulement si connecté
    if (!user?.uid) {
      router.push("/account");
      return;
    }

    setFavLoading(true);

    try {
      const offerRef = doc(db, "offers", offer.id);
      const favRef = doc(db, "users", user.uid, "favorites", offer.id);

      const res = await runTransaction(db, async (tx) => {
        const favSnap = await tx.get(favRef);
        const offerSnap = await tx.get(offerRef);

        if (!offerSnap.exists()) throw new Error("Offer not found");

        const currentCount = (offerSnap.data() as any)?.favoritesCount ?? 0;

        if (favSnap.exists()) {
          // remove fav
          tx.delete(favRef);
          const newCount = Math.max(0, currentCount - 1);
          tx.update(offerRef, {
            favoritesCount: newCount,
            updatedAt: serverTimestamp(),
          });
          return { isFavorite: false, favoritesCount: newCount };
        } else {
          // add fav
          // on garde tes infos optionnelles (ne casse rien)
          tx.set(
            favRef,
            {
              offerId: offer.id,
              createdAt: serverTimestamp(),
              title: offer.title ?? "",
              imageUrl: offer.imageUrl ?? "",
              partner: offer.partner ?? "",
            },
            { merge: true }
          );
          const newCount = currentCount + 1;
          tx.update(offerRef, {
            favoritesCount: newCount,
            updatedAt: serverTimestamp(),
          });
          return { isFavorite: true, favoritesCount: newCount };
        }
      });

      setIsFav(res.isFavorite);
      setOffer((prev) => (prev ? { ...prev, favoritesCount: res.favoritesCount } : prev));
    } catch (e) {
      console.error("Erreur toggle favoris:", e);
    } finally {
      setFavLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 sm:gap-8" aria-busy aria-label="Chargement de l’offre">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-7 w-28 rounded-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        <Skeleton className="aspect-[16/9] w-full rounded-3xl" />

        <div className="space-y-3">
          <Skeleton className="h-9 w-[85%] max-w-3xl" />
          <Skeleton className="h-4 w-40" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[78%]" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-14 w-full rounded-3xl" />
          <Skeleton className="h-14 w-full rounded-3xl" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/80 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/60">
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/80 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/60">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-44 rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Offre introuvable
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Cette offre n’existe pas (ou a été supprimée).
        </p>
        <Button onClick={() => router.push("/offers")}>Retour aux offres</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-7 sm:gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/offers"
            className="text-sm font-semibold text-slate-700 transition hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300"
          >
            ← Retour
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={offer.isFeatured ? "info" : "success"}>
            {offer.isFeatured ? "À la une" : "Bonne affaire"}
          </Badge>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {offer.favoritesCount ?? 0} favori{(offer.favoritesCount ?? 0) > 1 ? "s" : ""}
          </span>
          {offer.expiresAt ? (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {typeof (offer.expiresAt as { toDate?: () => Date }).toDate === "function"
                ? `Expire ${(offer.expiresAt as { toDate: () => Date }).toDate().toLocaleDateString("fr-FR")}`
                : typeof offer.expiresAt === "string" && offer.expiresAt.trim()
                  ? `Expire ${new Date(`${offer.expiresAt}T12:00:00`).toLocaleDateString("fr-FR")}`
                  : null}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200/70 shadow-sm dark:bg-slate-800 dark:ring-slate-700">
        <img
          src={imgSrc}
          alt={`Visuel : ${offer.title ?? "Offre"}`}
          className="aspect-[16/9] h-auto w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder-offer.png";
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-transparent" />
      </div>

      <header className="grid gap-3">
        <div className="grid gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {offer.title ?? "Sans titre"}
          </h1>
          {offer.partner?.trim() ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              {offer.partner}
            </p>
          ) : null}
        </div>

        {offer.description?.trim() ? (
          <p className="max-w-3xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {offer.description}
          </p>
        ) : null}
      </header>

      {expired ? (
        <Card className="border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="text-sm font-semibold">Offre expirée</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900 dark:text-amber-100/90">
            Cette offre n’est plus disponible. Consultez d’autres offres actives.
          </p>
        </Card>
      ) : null}

      <Card className="grid gap-4 border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/35 dark:border-emerald-900/30 dark:from-slate-900 dark:to-emerald-950/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Actions
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Profiter de l’offre
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {finalLinks[0]?.url ? (
            <a href={finalLinks[0].url} target="_blank" rel="noreferrer" className="block">
              <Button className="w-full">Ouvrir l’offre</Button>
            </a>
          ) : (
            <Button className="w-full" disabled>
              Aucun lien disponible
            </Button>
          )}

          <Button onClick={toggleFavorite} disabled={favLoading} variant="secondary" className="w-full">
            {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          </Button>
        </div>

        <ul className="mt-1 list-disc space-y-1 pl-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>Consultez les conditions chez l’enseigne (dates, produits concernés, magasins participants).</li>
          <li>Copiez un code promo si nécessaire, puis finalisez votre achat comme indiqué.</li>
          <li>Si une preuve d’achat est demandée, envoyez un ticket depuis votre espace.</li>
        </ul>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Liens
          </p>

          {finalLinks.length === 0 ? (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Aucun lien renseigné pour cette offre.
            </p>
          ) : (
            <div className="grid gap-2">
              {finalLinks.map((l, idx) => (
                <Link
                  key={`${l.url}-${idx}`}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group/link flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-[1px] hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/25"
                >
                  <span className="min-w-0 truncate">{l.label || `Lien ${idx + 1}`}</span>
                  <span className="shrink-0 text-slate-600 transition group-hover/link:text-emerald-700 dark:text-slate-400 dark:group-hover/link:text-emerald-300">
                    Ouvrir →
                  </span>
                </Link>
              ))}
            </div>
          )}

          {finalLinks[0]?.url ? (
            <a href={finalLinks[0].url} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full">
                Ouvrir le lien principal
              </Button>
            </a>
          ) : null}
        </Card>

        <Card className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Code promo
          </p>

          <p className="text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300">
            {offer.promoCode?.trim() ? offer.promoCode : "—"}
          </p>

          <Button
            onClick={() => {
              if (!offer.promoCode?.trim()) return;
              navigator.clipboard.writeText(offer.promoCode.trim());
            }}
            disabled={!offer.promoCode?.trim()}
            variant="secondary"
          >
            Copier le code
          </Button>
        </Card>
      </div>

      {offer.qrEnabled ? (
        <Card className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            QR Code
          </p>
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
            QR Code
          </div>
        </Card>
      ) : null}
    </div>
  );
}
