/**
 * Normalise les catégories d’une offre Firestore :
 * - préfère `categories: string[]` (ids ou libellés selon les données)
 * - sinon `[category]` si l’ancien champ chaîne est présent
 */
export function normalizeOfferCategories(v: Record<string, unknown>): string[] {
  const raw = v.categories;
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  const single = typeof v.category === "string" ? v.category.trim() : "";
  return single ? [single] : [];
}

/** Enseignes : ids catalogue type « store » (absent = []). */
export function normalizeOfferStores(v: Record<string, unknown>): string[] {
  const raw = v.stores;
  if (!Array.isArray(raw)) return [];
  const list = raw.map((x) => String(x).trim()).filter(Boolean);
  return [...new Set(list)].sort((a, b) => a.localeCompare(b, "fr"));
}

/** Texte de recherche / affichage secondaire à partir des entrées normalisées */
export function categoriesSearchBlob(categories: string[]): string {
  return categories.join(" ");
}

/** Libellés d’affichage : id Firestore → nom catalogue, sinon la chaîne brute (legacy). */
export function resolveCategoryLabels(
  ids: string[],
  catalog: { id: string; name: string }[]
): string[] {
  return ids.map((id) => {
    const c = catalog.find((x) => x.id === id);
    return c?.name?.trim() ? c.name : id;
  });
}

/** Libellés uniques, tri stables (affichage badges). */
export function sortedUniqueDisplayLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const lab of labels) {
    const t = lab.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out.sort((a, b) => a.localeCompare(b, "fr"));
}
