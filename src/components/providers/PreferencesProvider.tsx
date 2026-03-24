"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "fr" | "en";
type NavStyle = "bottom" | "top";

type PreferencesState = {
  language: Language;
  navStyle: NavStyle;
  setLanguage: (value: Language) => void;
  setNavStyle: (value: NavStyle) => void;
};

const PreferencesContext = createContext<PreferencesState | null>(null);

const STORAGE_KEY = "offera:preferences";

type StoredPreferences = {
  language?: Language;
  navStyle?: NavStyle;
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");
  const [navStyle, setNavStyle] = useState<NavStyle>("bottom");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredPreferences;
      if (parsed.language) setLanguage(parsed.language);
      if (parsed.navStyle) setNavStyle(parsed.navStyle);
    } catch {
      // Ignore invalid local storage content
    }
  }, []);

  useEffect(() => {
    const payload: StoredPreferences = { language, navStyle };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [language, navStyle]);

  const value = useMemo(
    () => ({ language, navStyle, setLanguage, setNavStyle }),
    [language, navStyle]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
