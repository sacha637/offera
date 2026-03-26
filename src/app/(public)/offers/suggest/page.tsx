"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

import { Button } from "../../../../components/ui/Button";
import { Card } from "../../../../components/ui/Card";
import { Input } from "../../../../components/ui/Input";
import { useAuth } from "../../../../components/providers/AuthProvider";
import { createOfferSuggestion } from "../../../../lib/firebase/offerSuggestions";

function mapSuggestionError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "permission-denied") {
      return "Envoi refusé : vérifiez que vous êtes bien connecté et que les règles Firestore autorisent votre compte.";
    }
    if (err.code === "unavailable" || err.code === "deadline-exceeded") {
      return "Service temporairement indisponible. Réessayez dans quelques instants.";
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("LIMIT_REACHED")) {
    return "Vous avez atteint la limite de 3 suggestions par jour (fuseau Europe/Paris). Revenez demain.";
  }
  if (msg.includes("TITLE_REQUIRED")) return "Le titre est obligatoire.";
  if (msg.includes("LINK_REQUIRED")) return "Au moins un lien valide est obligatoire.";
  if (msg.includes("AUTH_REQUIRED")) return "Connectez-vous pour envoyer une suggestion.";
  return "L’envoi n’a pas pu être effectué. Réessayez ou contactez le support si le problème persiste.";
}

export default function OfferSuggestPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!user?.uid) return false;
    if (submitting) return false;

    return (
      title.trim().length >= 3 &&
      partner.trim().length >= 2 &&
      link.trim().length >= 5
    );
  }, [user?.uid, submitting, title, partner, link]);

  if (loading) return <p className="text-slate-600">Chargement…</p>;

  if (!user) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Proposer une offre</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Connectez-vous pour soumettre une suggestion. Elle sera examinée par l’équipe avant publication.
        </p>
        <div className="mt-4">
          <Button onClick={() => router.push("/login")}>Se connecter</Button>
        </div>
      </Card>
    );
  }

  async function onSubmit() {
    setError(null);
    setSuccess(null);

    if (!user?.uid) {
      setError("Vous devez être connecté.");
      return;
    }
    if (!title.trim() || !partner.trim() || !link.trim()) {
      setError("Le nom de l’offre, le partenaire et le lien sont obligatoires.");
      return;
    }

    try {
      setSubmitting(true);

      await createOfferSuggestion(user.uid, {
        title: title.trim(),
        partner: partner.trim(),
        category: category.trim() || "",
        description: details.trim() || "",
        links: [link.trim()],
      });

      setSuccess("Votre suggestion a bien été envoyée. Nous l’étudierons sous peu.");
      setTitle("");
      setPartner("");
      setLink("");
      setCategory("");
      setDetails("");
    } catch (e: unknown) {
      setError(mapSuggestionError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Proposer une offre</h1>

        <Button variant="secondary" type="button" onClick={() => router.push("/offers")}>
          Retour aux offres
        </Button>
      </div>

      <Card className="grid gap-4 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Décrivez un bon plan ou une réduction intéressante. Maximum{" "}
          <strong>3 suggestions par jour et par compte</strong> (limite quotidienne, fuseau Europe/Paris).
        </p>

        <Input
          label="Nom de l’offre *"
          placeholder="Ex. : -20 % sur une gamme précise"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Enseigne ou magasin *"
          placeholder="Nom du point de vente ou du site"
          value={partner}
          onChange={(e) => setPartner(e.target.value)}
        />

        <Input
          label="Lien vers l’offre *"
          placeholder="https://…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <Input
          label="Catégorie (optionnel)"
          placeholder="Ex. : Alimentaire, Tech, Maison…"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Input
          label="Détails (optionnel)"
          placeholder="Conditions, dates, code promo éventuel…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

        <Button disabled={!canSubmit} type="button" onClick={onSubmit}>
          {submitting ? "Envoi en cours…" : "Envoyer la suggestion"}
        </Button>
      </Card>
    </div>
  );
}
