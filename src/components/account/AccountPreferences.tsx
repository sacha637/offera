"use client";

import { usePreferences } from "../providers/PreferencesProvider";

export function AccountPreferences() {
  const { language, setLanguage, navStyle, setNavStyle } = usePreferences();

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Langue</p>
        <div className="flex gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              language === "fr"
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200"
            }`}
            onClick={() => setLanguage("fr")}
            type="button"
          >
            Français
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              language === "en"
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200"
            }`}
            onClick={() => setLanguage("en")}
            type="button"
          >
            English
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Navigation mobile
        </p>
        <div className="flex gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              navStyle === "bottom"
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200"
            }`}
            onClick={() => setNavStyle("bottom")}
            type="button"
          >
            Barre du bas
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              navStyle === "top"
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-200"
            }`}
            onClick={() => setNavStyle("top")}
            type="button"
          >
            Barre du haut
          </button>
        </div>
      </div>
    </div>
  );
}
