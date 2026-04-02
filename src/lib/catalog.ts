import type { Category } from "./types";

/** Thèmes = tout sauf type explicite « store ». Enseignes = type === « store ». */
export function splitCatalogByType(catalog: Category[]): {
  themes: Category[];
  stores: Category[];
} {
  const themes: Category[] = [];
  const stores: Category[] = [];
  for (const c of catalog) {
    if (c.type === "store") stores.push(c);
    else themes.push(c);
  }
  themes.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  stores.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return { themes, stores };
}
