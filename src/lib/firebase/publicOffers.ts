import { FirebaseError } from "firebase/app";
import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

const DEFAULT_TIMEOUT_MS = 22_000;

class FetchTimeoutError extends Error {
  constructor() {
    super("OFFERA_FETCH_TIMEOUT");
    this.name = "FetchTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new FetchTimeoutError()), ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

/**
 * Liste publique : `where("isActive","==",true)` — aligné avec les règles Firestore.
 * @deprecated Préférer `fetchPublicOffersResult` pour éviter blocages et erreurs silencieuses.
 */
export async function fetchPublicActiveOffers(
  db: Firestore
): Promise<QueryDocumentSnapshot[]> {
  const q = query(collection(db, "offers"), where("isActive", "==", true));
  const snap = await getDocs(q);
  return snap.docs;
}

export type PublicOffersFetchResult =
  | { status: "ok"; docs: QueryDocumentSnapshot[] }
  | { status: "error"; message: string; kind: "timeout" | "permission" | "network" | "unknown" };

/**
 * Chargement public fiable : timeout réseau, pas de throw (états explicites pour l’UI).
 */
export async function fetchPublicOffersResult(
  db: Firestore,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<PublicOffersFetchResult> {
  try {
    const q = query(collection(db, "offers"), where("isActive", "==", true));
    const snap = await withTimeout(getDocs(q), timeoutMs);
    return { status: "ok", docs: snap.docs };
  } catch (e: unknown) {
    if (e instanceof FetchTimeoutError) {
      return {
        status: "error",
        kind: "timeout",
        message:
          "Le chargement a pris trop de temps. Vérifiez votre connexion et réessayez.",
      };
    }
    if (e instanceof FirebaseError) {
      if (e.code === "permission-denied") {
        return {
          status: "error",
          kind: "permission",
          message: publicOffersErrorMessage(e),
        };
      }
      if (e.code === "unavailable" || e.message?.includes("network")) {
        return {
          status: "error",
          kind: "network",
          message: "Réseau indisponible ou instable. Réessayez dans un instant.",
        };
      }
      return {
        status: "error",
        kind: "unknown",
        message: e.message || "Erreur lors du chargement des offres.",
      };
    }
    if (e instanceof Error) {
      return { status: "error", kind: "unknown", message: e.message };
    }
    return {
      status: "error",
      kind: "unknown",
      message: "Erreur inattendue lors du chargement des offres.",
    };
  }
}

export function isFirestorePermissionDenied(e: unknown): boolean {
  return e instanceof FirebaseError && e.code === "permission-denied";
}

export function publicOffersErrorMessage(e: unknown): string {
  if (isFirestorePermissionDenied(e)) {
    return "Accès aux offres refusé. Vérifiez que les règles Firestore sont déployées et que chaque offre publique a le champ « isActive » à true.";
  }
  if (e instanceof FirebaseError) {
    return e.message || "Erreur Firestore.";
  }
  if (e instanceof Error) return e.message;
  return "Erreur de chargement.";
}
