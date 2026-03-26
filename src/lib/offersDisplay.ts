import type { Category } from "./types";

/** Champ absent ou true = visible publiquement ; false masque explicitement. */
export function isOfferPubliclyActive(v: { isActive?: unknown }): boolean {
  return v.isActive !== false;
}

/** Date d’expiration Firestore (timestamp), chaîne YYYY-MM-DD, ou absent. */
export function isOfferExpired(expiresAt: unknown): boolean {
  if (!expiresAt) return false;
  if (typeof (expiresAt as { toDate?: () => Date }).toDate === "function") {
    return (expiresAt as { toDate: () => Date }).toDate() < new Date();
  }
  if (typeof expiresAt === "string" && expiresAt.trim()) {
    return new Date(`${expiresAt}T23:59:59`).getTime() < Date.now();
  }
  return false;
}

function foldForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Filtre par catégorie (libellé admin vs id mock) */
export function offerMatchesCategory(
  offerCategory: string | undefined,
  selectedCategoryId: string | null,
  allCategories: Category[]
): boolean {
  if (!selectedCategoryId) return true;
  const cat = allCategories.find((c) => c.id === selectedCategoryId);
  if (!cat) return true;
  const o = foldForSearch((offerCategory ?? "").trim());
  if (!o) return false;
  const name = foldForSearch(cat.name);
  const id = foldForSearch(cat.id);
  return o === name || o === id || o.includes(name) || name.includes(o);
}

/** Score de pertinence recherche (plus haut = mieux) */
export function searchRelevanceScore(
  offer: {
    title?: string;
    description?: string;
    partner?: string;
    category?: string;
  },
  rawQuery: string
): number {
  const q = foldForSearch(rawQuery.trim());
  if (!q) return 0;
  const t = foldForSearch(offer.title ?? "");
  const d = foldForSearch(offer.description ?? "");
  const p = foldForSearch(offer.partner ?? "");
  const c = foldForSearch(offer.category ?? "");
  let s = 0;
  if (t.includes(q)) s += 100;
  if (t.startsWith(q)) s += 30;
  if (p.includes(q)) s += 55;
  if (c.includes(q)) s += 45;
  if (d.includes(q)) s += 28;
  const blob = `${t} ${d} ${p} ${c}`;
  if (blob.includes(q) && s === 0) s += 8;
  return s;
}

type OfferSortable = {
  title?: string;
  description?: string;
  partner?: string;
  category?: string;
  isFeatured?: boolean;
  favoritesCount?: number;
  createdAt?: { toMillis?: () => number };
};

/** Tri liste /offers : recherche + catégorie + featured + favoris + récence */
export function filterAndSortOffers<T extends OfferSortable>(
  offers: T[],
  options: {
    search: string;
    categoryId: string | null;
    categories: Category[];
  }
): T[] {
  const { search, categoryId, categories } = options;
  const q = foldForSearch(search.trim());

  let list = offers.filter((o) => offerMatchesCategory(o.category, categoryId, categories));

  if (q) {
    list = list.filter((o) => {
      const hay = foldForSearch(
        `${o.title ?? ""} ${o.description ?? ""} ${o.partner ?? ""} ${o.category ?? ""}`
      );
      return hay.includes(q);
    });
  }

  return [...list].sort((a, b) => {
    const sa = searchRelevanceScore(a, search);
    const sb = searchRelevanceScore(b, search);
    if (q && sa !== sb) return sb - sa;

    const fa = a.isFeatured ? 1 : 0;
    const fb = b.isFeatured ? 1 : 0;
    if (fa !== fb) return fb - fa;

    const favA = a.favoritesCount ?? 0;
    const favB = b.favoritesCount ?? 0;
    if (favA !== favB) return favB - favA;

    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

/** Top par favoris puis récence (accueil, sans index composite) */
export function sortTopByFavoritesThenRecent<T extends OfferSortable>(offers: T[]): T[] {
  return [...offers].sort((a, b) => {
    const favA = a.favoritesCount ?? 0;
    const favB = b.favoritesCount ?? 0;
    if (favA !== favB) return favB - favA;
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}
