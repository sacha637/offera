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
import { db } from "../../../../lib/firebase/client";
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

  const expired = Boolean(
    offer?.expiresAt?.toDate && offer.expiresAt.toDate() < new Date()
  );

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
    return <p className="text-slate-500">Chargement…</p>;
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
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <Badge variant={offer.isFeatured ? "info" : "success"}>
          {offer.isFeatured ? "Top" : "Offre"}
        </Badge>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">❤️ {offer.favoritesCount ?? 0}</span>

          {offer.expiresAt?.toDate && (
            <span className="text-xs text-slate-500">
              Expire {offer.expiresAt.toDate().toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
      </div>

      <img
        src={imgSrc}
        alt={`Illustration ${offer.title ?? "Offre"}`}
        className="h-64 w-full rounded-3xl object-cover"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/placeholder-offer.png";
        }}
      />

      <div className="grid gap-3">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {offer.title ?? "Sans titre"}
        </h1>
        <p className="text-sm font-semibold text-emerald-600">
          {offer.partner ?? ""}
        </p>
        <p className="text-base text-slate-600 dark:text-slate-300">
          {offer.description ?? ""}
        </p>
      </div>

      {expired ? (
        <Card className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Cette offre est expirée. Consultez d’autres offres actives.
        </Card>
      ) : null}

      <Card className="grid gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Comment profiter de l’offre sur Offera
        </h2>

        <ul className="list-disc pl-6 text-sm text-slate-600 dark:text-slate-300">
          <li>
            Offera met en avant des réductions, codes promo et bons plans en magasin ou en ligne, selon ce
            que le partenaire propose.
          </li>
          <li>
            Ouvrez un lien si disponible, ou copiez le code promo s’il y en a un.
          </li>
          <li>
            Respectez les conditions affichées chez l’enseigne (dates, produits concernés, magasins
            participants).
          </li>
          <li>
            Si votre parcours inclut l’envoi d’un ticket de caisse sur Offera, suivez les étapes indiquées
            dans votre espace.
          </li>
        </ul>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Liens
          </p>

          {finalLinks.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
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
                  className="text-sm text-emerald-600 underline"
                >
                  {l.label || `Lien ${idx + 1}`}
                </Link>
              ))}
            </div>
          )}

          {finalLinks[0]?.url ? (
            <a href={finalLinks[0].url} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full">
                Ouvrir le 1er lien
              </Button>
            </a>
          ) : null}
        </Card>

        <Card className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Code promo
          </p>

          <p className="text-2xl font-bold text-emerald-600">
            {offer.promoCode?.trim() ? offer.promoCode : "—"}
          </p>

          <Button
            onClick={() => {
              if (!offer.promoCode?.trim()) return;
              navigator.clipboard.writeText(offer.promoCode.trim());
            }}
            disabled={!offer.promoCode?.trim()}
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

      <Button onClick={toggleFavorite} disabled={favLoading}>
        {isFav ? "💚 Retirer des favoris Offera" : "❤️ Ajouter aux favoris Offera"}
      </Button>
    </div>
  );
}
