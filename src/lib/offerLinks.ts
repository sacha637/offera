export type OfferLinkType = "coupon" | "odr" | "shop" | "other";

export type OfferLinkItem = {
  title: string;
  description?: string;
  url: string;
  type?: OfferLinkType;
};

const LINK_TYPES = new Set<string>(["coupon", "odr", "shop", "other"]);

function parseLinkType(raw: unknown): OfferLinkType | undefined {
  const t = String(raw ?? "").trim();
  return LINK_TYPES.has(t) ? (t as OfferLinkType) : undefined;
}

/**
 * Compat : string[] | {label,url} | {title,description?,url,type?}
 */
export function normalizeOfferLinks(v: Record<string, unknown>): OfferLinkItem[] {
  const raw = v.links;
  const out: OfferLinkItem[] = [];

  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === "string") {
      for (const s of raw as string[]) {
        const url = String(s).trim();
        if (url) out.push({ title: "Voir l’offre", url });
      }
    } else {
      for (const item of raw as Record<string, unknown>[]) {
        const url = String(item.url ?? "").trim();
        if (!url) continue;
        const title =
          String(item.title ?? item.label ?? "").trim() || "Voir l’offre";
        const desc = String(item.description ?? "").trim();
        const type = parseLinkType(item.type);
        const entry: OfferLinkItem = { title, url };
        if (desc) entry.description = desc;
        if (type) entry.type = type;
        out.push(entry);
      }
    }
  }

  if (out.length === 0) {
    const single = typeof v.link === "string" ? v.link.trim() : "";
    if (single) out.push({ title: "Voir l’offre", url: single });
  }

  return out;
}

/** Prépare l’écriture Firestore (pas d’objets vides inutiles). */
export function linksToFirestorePayload(items: OfferLinkItem[]): OfferLinkItem[] {
  return items
    .filter((x) => x.url.trim().length > 0)
    .map((x) => {
      const title = x.title.trim() || "Voir l’offre";
      const row: OfferLinkItem = { title, url: x.url.trim() };
      const d = x.description?.trim();
      if (d) row.description = d;
      if (x.type) row.type = x.type;
      return row;
    });
}

export function firstLinkUrl(items: OfferLinkItem[]): string {
  return items[0]?.url?.trim() ?? "";
}

export function linkCtaLabel(type?: OfferLinkType): string {
  switch (type) {
    case "coupon":
      return "Activer";
    case "odr":
      return "Participer";
    case "shop":
      return "Voir en magasin";
    default:
      return "Ouvrir";
  }
}

export function linkTypeIcon(type?: OfferLinkType): string {
  switch (type) {
    case "coupon":
      return "🎫";
    case "odr":
      return "📋";
    case "shop":
      return "🛒";
    default:
      return "🔗";
  }
}
