import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// ➕ Favori ajouté
export const onFavoriteCreated = onDocumentCreated(
  "users/{uid}/favorites/{offerId}",
  async (event) => {
    const offerId = event.params.offerId as string;
    const offerRef = db.doc(`offers/${offerId}`);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(offerRef);
      if (!snap.exists) return;

      const current = (snap.get("favoritesCount") as number) ?? 0;

      tx.update(offerRef, {
        favoritesCount: current + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
);

// ➖ Favori supprimé
export const onFavoriteDeleted = onDocumentDeleted(
  "users/{uid}/favorites/{offerId}",
  async (event) => {
    const offerId = event.params.offerId as string;
    const offerRef = db.doc(`offers/${offerId}`);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(offerRef);
      if (!snap.exists) return;

      const current = (snap.get("favoritesCount") as number) ?? 0;

      tx.update(offerRef, {
        favoritesCount: Math.max(0, current - 1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
);