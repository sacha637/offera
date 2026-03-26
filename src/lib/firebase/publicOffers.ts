import { FirebaseError } from "firebase/app";
import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

/**
 * Liste publique des offres : requête contrainte pour respecter les règles Firestore.
 * Une requête sur toute la collection sans filtre peut échouer (permission-denied) dès qu’il
 * existe des documents non lisibles par le public (ex. offres inactives), car la requête
 * doit pouvoir ne retourner que des documents autorisés.
 */
export async function fetchPublicActiveOffers(
  db: Firestore
): Promise<QueryDocumentSnapshot[]> {
  const q = query(collection(db, "offers"), where("isActive", "==", true));
  const snap = await getDocs(q);
  return snap.docs;
}

export function isFirestorePermissionDenied(e: unknown): boolean {
  return e instanceof FirebaseError && e.code === "permission-denied";
}

export function publicOffersErrorMessage(e: unknown): string {
  if (isFirestorePermissionDenied(e)) {
    return "Lecture des offres refusée par Firebase. Déployez les règles Firestore à jour et assurez-vous que chaque offre publique a le champ « isActive » à true (les anciens documents sans ce champ doivent être migrés).";
  }
  if (e instanceof FirebaseError) {
    return e.message || "Erreur Firestore.";
  }
  if (e instanceof Error) return e.message;
  return "Erreur de chargement.";
}
