export type OfferBadge = "Nouveau" | "Top" | "Expire bientôt" | "Featured";

export type Offer = {
  id: string;
  title: string;
  partner: string;
  description: string;
  imageUrl: string;
  category: string;
  featured: boolean;
  priority: number;
  expiresAt: string;
  popularity: number;
  badge?: OfferBadge;
  qrEnabled?: boolean;
};

/** Catégorie catalogue (mock ou Firestore `categories/{id}`). */
export type Category = {
  id: string;
  name: string;
  slug?: string;
  /** ex. "theme" | "store" */
  type?: string;
  active?: boolean;
};
