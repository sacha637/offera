// src/lib/admin.ts

export function getAdminEmails(): string[] {
    const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  
  export function isAdminEmail(email?: string | null): boolean {
    if (!email) return false;
  
    const admins = getAdminEmails();
  
    // ✅ Sécurité: si la whitelist est vide, PERSONNE n'est admin
    if (admins.length === 0) return false;
  
    return admins.includes(email.trim().toLowerCase());
  }
  
  // (Optionnel) utile pour afficher/masquer le bouton admin facilement
  export function canShowAdminButton(email?: string | null): boolean {
    return isAdminEmail(email);
  }
  