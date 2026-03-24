"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";

import { Card } from "../../../components/ui/Card";
import { db } from "../../../lib/firebase/client";
import { useAuth } from "../../../components/providers/AuthProvider";

type FavoriteItem = {
  offerId: string;
  title?: string;
  imageUrl?: string;
  partner?: string;
};

export default function FavoritesPage() {
  const { user, loading } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setFavorites([]);
      setLoadingFavs(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoadingFavs(true);

        // 1) lire la liste des favoris (ids)
        const favRef = collection(db, "users", user.uid, "favorites");
        const q = query(favRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const ids = snap.docs.map((d) => d.id);

        if (ids.length === 0) {
          setFavorites([]);
          return;
        }

        // 2) récupérer les offres correspondantes
        const offers = await Promise.all(
          ids.map(async (offerId) => {
            const offerRef = doc(db, "offers", offerId);
            const offerSnap = await getDoc(offerRef);

            if (!offerSnap.exists()) {
              // offre supprimée -> on l’ignore
              return null;
            }

            const v = offerSnap.data() as Record<string, unknown>;

            return {
              offerId,
              title: v.title ?? "Offre",
              imageUrl: v.imageUrl ?? "",
              partner: v.partner ?? "",
            } as FavoriteItem;
          })
        );

        setFavorites(offers.filter(Boolean) as FavoriteItem[]);
      } catch (e) {
        console.error("Erreur chargement favoris:", e);
        setFavorites([]);
      } finally {
        setLoadingFavs(false);
      }
    };

    fetchFavorites();
  }, [user?.uid]);

  if (loading) {
    return <p className="text-slate-500">Chargement…</p>;
  }

  if (!user) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Favoris Offera
        </h1>

        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Connectez-vous pour enregistrer et retrouver vos offres favorites sur Offera.
          </p>

          <div className="mt-3">
            <Link href="/login" className="text-sm font-semibold text-emerald-600">
              Se connecter
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loadingFavs) {
    return <p className="text-slate-500">Chargement des favoris…</p>;
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Favoris Offera
      </h1>

      {favorites.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Aucun favori pour le moment. Parcourez les offres et ajoutez celles qui vous intéressent.
          </p>

          <div className="mt-3">
            <Link href="/offers" className="text-sm font-semibold text-emerald-600">
              Parcourir les offres
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <Link
              key={fav.offerId}
              href={`/offers/${encodeURIComponent(String(fav.offerId))}`}
              className="group"
            >
              <Card className="grid gap-3 transition hover:shadow-md">
                <img
                  src={fav.imageUrl?.trim() ? fav.imageUrl : "/placeholder-offer.png"}
                  alt={fav.title ?? "Offre Offera"}
                  className="h-40 w-full rounded-xl object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder-offer.png";
                  }}
                />

                <div className="grid gap-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {fav.title ?? "Offre"}
                  </p>
                  <p className="text-xs text-slate-500">{fav.partner ?? ""}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
