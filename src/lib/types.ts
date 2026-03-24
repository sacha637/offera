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

export type Category = {
  id: string;
  name: string;
};
