import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type { Category } from "../types";
import { categories as mockCategories } from "../mock";

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "categorie";
}

export function normalizeCategoryName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

async function uniqueSlug(db: Firestore, base: string, excludeDocId?: string): Promise<string> {
  let candidate = base;
  let n = 0;
  while (n < 50) {
    const q = query(collection(db, "categories"), where("slug", "==", candidate));
    const snap = await getDocs(q);
    const taken = snap.docs.some((d) => d.id !== excludeDocId);
    if (!taken) return candidate;
    n += 1;
    candidate = `${base}-${n + 1}`;
  }
  return `${base}-${Date.now()}`;
}

function docToCategory(d: { id: string; data: () => Record<string, unknown> }): Category {
  const v = d.data();
  return {
    id: d.id,
    name: String(v.name ?? ""),
    slug: typeof v.slug === "string" ? v.slug : undefined,
    type: typeof v.type === "string" ? v.type : undefined,
    active: v.active !== false,
  };
}

/** Catalogue public + UI : catégories actives, tri par nom. Fallback mock si vide ou erreur. */
export async function fetchCategoriesForUi(db: Firestore): Promise<Category[]> {
  try {
    const q = query(collection(db, "categories"), where("active", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((x) => docToCategory(x));
    const withNames = list.filter((c) => c.name.trim().length > 0);
    if (withNames.length > 0) {
      return [...withNames].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    }
  } catch {
    // réseau / règles : fallback
  }
  return [...mockCategories];
}

/** Admin : toutes les catégories (lecture réservée admin côté règles). */
export async function fetchAllCategoriesAdmin(db: Firestore): Promise<Category[]> {
  const snap = await getDocs(collection(db, "categories"));
  const list = snap.docs.map((x) => docToCategory(x));
  return list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function createCategory(
  db: Firestore,
  input: { name: string; type?: string; active?: boolean }
): Promise<string> {
  const name = normalizeCategoryName(input.name);
  if (!name) throw new Error("Nom requis");
  const slug = await uniqueSlug(db, slugify(name));
  const data: Record<string, unknown> = {
    name,
    slug,
    active: input.active !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const t = input.type?.trim();
  if (t) data.type = t;
  const ref = await addDoc(collection(db, "categories"), data);
  return ref.id;
}

export async function updateCategory(
  db: Firestore,
  id: string,
  patch: { name?: string; slug?: string; type?: string | null; active?: boolean }
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.name !== undefined) payload.name = normalizeCategoryName(patch.name);
  if (patch.slug !== undefined) {
    const raw = patch.slug.trim();
    const base = raw
      ? slugify(raw)
      : slugify(normalizeCategoryName(typeof patch.name === "string" ? patch.name : ""));
    payload.slug = await uniqueSlug(db, base || "categorie", id);
  }
  if (patch.type !== undefined) {
    payload.type = patch.type && patch.type.trim() ? patch.type.trim() : deleteField();
  }
  if (patch.active !== undefined) payload.active = patch.active;
  await updateDoc(doc(db, "categories", id), payload);
}

export async function deleteCategory(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, "categories", id));
}
