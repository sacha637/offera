import type { Category } from "./types";

/** Filtre par catégorie (libellé admin vs id mock) */
export function offerMatchesCategory(
  offerCategory: string | undefined,
  selectedCategoryId: string | null,
  allCategories: Category[]
): boolean {
  if (!selectedCategoryId) return true;
  const cat = allCategories.find((c) => c.id === selectedCategoryId);
  if (!cat) return true;
  const o = (offerCategory ?? "").trim().toLowerCase();
  if (!o) return false;
  const name = cat.name.toLowerCase();
  const id = cat.id.toLowerCase();
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
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;
  const t = (offer.title ?? "").toLowerCase();
  const d = (offer.description ?? "").toLowerCase();
  const p = (offer.partner ?? "").toLowerCase();
  const c = (offer.category ?? "").toLowerCase();
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
  const q = search.trim().toLowerCase();

  let list = offers.filter((o) => offerMatchesCategory(o.category, categoryId, categories));

  if (q) {
    list = list.filter((o) => {
      const hay = `${o.title ?? ""} ${o.description ?? ""} ${o.partner ?? ""} ${o.category ?? ""}`.toLowerCase();
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
