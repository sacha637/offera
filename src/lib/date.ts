// src/lib/date.ts
export function dateIdParis(d = new Date()) {
    // yyyyMMdd (Europe/Paris) sans lib externe
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
  
    const y = parts.find((p) => p.type === "year")?.value ?? "0000";
    const m = parts.find((p) => p.type === "month")?.value ?? "00";
    const day = parts.find((p) => p.type === "day")?.value ?? "00";
  
    return `${y}${m}${day}`;
  }
  