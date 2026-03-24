import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

export async function isOfferFavorited(params: { uid: string; offerId: string }) {
  const { uid, offerId } = params;
  const favRef = doc(db, "users", uid, "favorites", offerId);
  const snap = await getDoc(favRef);
  return snap.exists();
}

export async function toggleFavorite(params: { uid: string; offerId: string }) {
  const { uid, offerId } = params;

  const offerRef = doc(db, "offers", offerId);
  const favRef = doc(db, "users", uid, "favorites", offerId);

  return runTransaction(db, async (tx) => {
    const favSnap = await tx.get(favRef);
    const offerSnap = await tx.get(offerRef);

    if (!offerSnap.exists()) throw new Error("Offer not found");

    const currentCount = (offerSnap.data() as any)?.favoritesCount ?? 0;

    if (favSnap.exists()) {
      tx.delete(favRef);
      const newCount = Math.max(0, currentCount - 1);
      tx.update(offerRef, { favoritesCount: newCount, updatedAt: serverTimestamp() });
      return { isFavorite: false, favoritesCount: newCount };
    } else {
      tx.set(favRef, { createdAt: serverTimestamp() });
      const newCount = currentCount + 1;
      tx.update(offerRef, { favoritesCount: newCount, updatedAt: serverTimestamp() });
      return { isFavorite: true, favoritesCount: newCount };
    }
  });
}
