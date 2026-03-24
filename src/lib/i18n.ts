"use client";

import { usePreferences } from "../components/providers/PreferencesProvider";

const dictionary = {
  fr: {
    homeTitle: "Des offres utiles, des réductions à combiner, un suivi simple.",
  },
  en: {
    homeTitle: "Useful deals, stackable discounts, simple tracking.",
  },
};

export function useI18n() {
  const { language } = usePreferences();
  return dictionary[language];
}
