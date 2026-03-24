// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { BRAND_URL } from "../lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BRAND_URL}/`, lastModified },
    { url: `${BRAND_URL}/offers`, lastModified },
    { url: `${BRAND_URL}/offers/expired`, lastModified },
    { url: `${BRAND_URL}/favorites`, lastModified },
    { url: `${BRAND_URL}/tickets`, lastModified },
    { url: `${BRAND_URL}/tickets/mine`, lastModified },
    { url: `${BRAND_URL}/offers/suggest`, lastModified },
    { url: `${BRAND_URL}/login`, lastModified },
    { url: `${BRAND_URL}/register`, lastModified },
    { url: `${BRAND_URL}/account`, lastModified },
  ];
}
