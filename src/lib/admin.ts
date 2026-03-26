// src/lib/admin.ts

/** Seul ce compte voit les entrées « Admin » dans l’UI publique (bottom nav, lien flottant). */
export const OWNER_PUBLIC_ADMIN_EMAIL = "sacha.merlin637@gmail.com";

export function canShowPublicAdminUi(email?: string | null): boolean {
  if (!email?.trim()) return false;
  return email.trim().toLowerCase() === OWNER_PUBLIC_ADMIN_EMAIL.toLowerCase();
}

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
  