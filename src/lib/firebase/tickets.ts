"use client";

import { db, getFirebaseStorage } from "./client";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
  doc,
  deleteDoc,
  type Timestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

export const __TICKETS_MODULE_OK__ = true; // ✅ marqueur pour vérifier que le module est bien pris

type CreateTicketArgs = {
  uid: string;
  title: string;
  store: string;
  file: File;
  offerId?: string | null;
  note?: string | null;
};

export type TicketItem = {
  id: string;
  uid: string;
  title: string;
  store: string;
  imageUrl: string;
  storagePath: string;
  status: string;
  createdAt: Timestamp | null;
  offerId: string | null;
  note: string | null;
};

function safeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

export async function createTicketWithUpload(args: CreateTicketArgs) {
  const { uid, title, store, file, offerId = null, note = null } = args;

  if (!uid) throw new Error("uid manquant");
  if (!title?.trim()) throw new Error("Titre manquant");
  if (!store?.trim()) throw new Error("Enseigne manquante");
  if (!file) throw new Error("Fichier manquant");
  if (!file.type.startsWith("image/")) throw new Error("Le fichier doit être une image");

  const filename = `${Date.now()}_${safeFileName(file.name)}`;
  const storagePath = `tickets/${uid}/${filename}`;

  const storage = getFirebaseStorage();
  const storageRef = ref(storage, storagePath);
  try {
    await uploadBytes(storageRef, file, { contentType: file.type });
  } catch (e) {
    console.error("[storage] uploadBytes failed", { op: "ticket", path: storagePath }, e);
    throw e;
  }

  const imageUrl = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, "tickets"), {
    uid,
    title: title.trim(),
    store: store.trim(),
    offerId,
    note,
    imageUrl,
    storagePath,
    status: "submitted",
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, imageUrl };
}

export async function getMyTickets(uid: string, max = 25): Promise<TicketItem[]> {
  if (!uid) return [];

  const q = query(
    collection(db, "tickets"),
    where("uid", "==", uid),
    limit(max)
  );

  const snap = await getDocs(q);

  const items: TicketItem[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      uid: data.uid ?? uid,
      title: data.title ?? "",
      store: data.store ?? "",
      imageUrl: data.imageUrl ?? "",
      storagePath: data.storagePath ?? "",
      status: data.status ?? "submitted",
      createdAt: data.createdAt ?? null,
      offerId: data.offerId ?? null,
      note: data.note ?? null,
    };
  });

  // tri côté client (pas besoin d’index Firestore)
  items.sort((a, b) => {
    const ta = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
    const tb = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
    return tb - ta;
  });

  return items;
}

// ✅ C’EST CET EXPORT QUE Next CHERCHE
export async function deleteMyTicket(params: {
  uid: string;
  ticketId: string;
  storagePath?: string | null;
}) {
  const { uid, ticketId, storagePath } = params;

  if (!uid) throw new Error("uid manquant");
  if (!ticketId) throw new Error("ticketId manquant");

  if (storagePath) {
    const storage = getFirebaseStorage();
    try {
      await deleteObject(ref(storage, storagePath));
    } catch (e) {
      console.error("[storage] deleteObject failed", { op: "ticket", path: storagePath }, e);
      throw e;
    }
  }

  await deleteDoc(doc(db, "tickets", ticketId));
}
