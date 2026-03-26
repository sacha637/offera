// src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "../components/providers/AppProviders";
import { BRAND_NAME, BRAND_URL } from "../lib/brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} – Bons plans & réductions`,
    template: `%s – ${BRAND_NAME}`,
  },
  description: `${BRAND_NAME} : bons plans en magasin, réductions à combiner et offres sélectionnées, avec un parcours simple.`,
  metadataBase: new URL(BRAND_URL),

  openGraph: {
    title: `${BRAND_NAME} – Bons plans & réductions`,
    description: `${BRAND_NAME} : offres en magasin et en ligne, réductions et bons plans.`,
    url: BRAND_URL,
    siteName: BRAND_NAME,
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} – Bons plans & réductions`,
    description: `${BRAND_NAME} : bons plans et réductions pour vos achats.`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="light">
      <body className={`${inter.variable} bg-slate-50 text-slate-900 antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
