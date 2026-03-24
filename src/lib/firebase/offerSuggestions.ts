// src/lib/firebase/offerSuggestions.ts
import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";
import { dateIdParis } from "../date";

export type SuggestStatus = "pending" | "approved" | "rejected" | "needs_info";

export type OfferSuggestionInput = {
  title: string;
  partner?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  links?: string[]; // urls
  promoCode?: string;
};

export async function createOfferSuggestion(uid: string, input: OfferSuggestionInput) {
  if (!uid) throw new Error("AUTH_REQUIRED");

  const dateId = dateIdParis(new Date());

  // compteur par jour: users/{uid}/offerSuggestionDaily/{yyyyMMdd}
  const counterRef = doc(db, "users", uid, "offerSuggestionDaily", dateId);

  // suggestion: offerSuggestions/{id}
  const suggestionsCol = collection(db, "offerSuggestions");

  const title = input.title?.trim();
  if (!title) throw new Error("TITLE_REQUIRED");

  const links = (input.links ?? []).map((x) => x.trim()).filter(Boolean).slice(0, 5);
  if (links.length === 0) throw new Error("LINK_REQUIRED");

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const current = counterSnap.exists() ? Number(counterSnap.data()?.count ?? 0) : 0;

    if (current >= 3) {
      throw new Error("LIMIT_REACHED");
    }

    if (!counterSnap.exists()) {
      tx.set(counterRef, {
        date: dateId,
        count: 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.update(counterRef, {
        count: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    const newDocRef = doc(suggestionsCol);
    tx.set(newDocRef, {
      title,
      partner: input.partner?.trim() || "",
      category: input.category?.trim() || "",
      description: input.description?.trim() || "",
      imageUrl: input.imageUrl?.trim() || "",
      links,
      promoCode: input.promoCode?.trim() || "",

      status: "pending" as SuggestStatus,
      userId: uid, // ✅ au lieu de uid

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}