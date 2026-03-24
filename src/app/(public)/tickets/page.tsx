"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../../../components/providers/AuthProvider";

import {
  createTicketWithUpload,
  getMyTickets,
  deleteMyTicket,
  type TicketItem,
} from "../../../lib/firebase/tickets";

function isImage(file: File | null) {
  return !!file && file.type.startsWith("image/");
}

function formatDate(createdAt: any) {
  try {
    if (!createdAt) return "—";
    const dt =
      typeof createdAt.toDate === "function" ? createdAt.toDate() : new Date(createdAt);

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  } catch {
    return "—";
  }
}

export default function TicketsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [store, setStore] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 🔐 Redirection si non connecté
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const uid = user?.uid;

  async function refreshTickets() {
    if (!uid) return;
    setLoadingTickets(true);
    try {
      const list = await getMyTickets(uid, 25);
      setTickets(list);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Impossible de charger tes tickets.");
    } finally {
      setLoadingTickets(false);
    }
  }

  useEffect(() => {
    if (!uid) return;
    refreshTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const canSubmit = useMemo(() => {
    return (
      !!uid &&
      title.trim().length > 0 &&
      store.trim().length > 0 &&
      isImage(file) &&
      !submitting
    );
  }, [uid, title, store, file, submitting]);

  if (loading) return <p className="text-slate-500">Chargement…</p>;
  if (!user) return null;

  async function onSubmit() {
    setError(null);
    setSuccess(null);

    if (!uid) return setError("Tu dois être connecté.");
    if (!file) return setError("Ajoute une image.");
    if (!isImage(file)) return setError("Le fichier doit être une image.");
    if (!title.trim() || !store.trim()) return setError("Titre et enseigne obligatoires.");

    try {
      setSubmitting(true);

      await createTicketWithUpload({
        uid,
        title: title.trim(),
        store: store.trim(),
        file,
      });

      setSuccess("Ticket envoyé ✅");
      setTitle("");
      setStore("");
      setFile(null);

      await refreshTickets();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Erreur lors de l’envoi du ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(ticket: TicketItem) {
    if (!uid) return;

    const ok = window.confirm("Tu es sûr de vouloir supprimer ce ticket ?");
    if (!ok) return;

    try {
      setDeletingId(ticket.id);
      setError(null);
      setSuccess(null);

      await deleteMyTicket({
        uid,
        ticketId: ticket.id,
        storagePath: ticket.storagePath,
      });

      setSuccess("Ticket supprimé ✅");
      await refreshTickets();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Tickets Offera
        </h1>

        {/* ✅ Bouton proposer une offre */}
        <Button variant="secondary" onClick={() => router.push("/offers/suggest")}>
          Proposer une offre
        </Button>
      </div>

      {/* ✅ FORMULAIRE EN HAUT */}
      <Card className="grid gap-4 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ajoutez une photo lisible de votre ticket pour traiter votre demande selon les règles en vigueur.
        </p>

        <Input
          label="Titre"
          placeholder="Ex: Courses du samedi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Enseigne"
          placeholder="Ex: Leclerc, Auchan, Carrefour…"
          value={store}
          onChange={(e) => setStore(e.target.value)}
        />

        <div className="grid gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Photo du ticket
          </p>

          {/* ✅ Consignes claires */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <p className="font-semibold">Pour que ton ticket soit validé :</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Ticket entier visible (haut + bas), pas coupé.</li>
              <li>Photo nette, sans flou, sans reflets.</li>
              <li>Date + magasin + total lisibles.</li>
              <li>Une seule photo = un ticket (pas de montage).</li>
            </ul>
          </div>

          <label className="cursor-pointer rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 hover:border-emerald-400 dark:border-slate-700">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setError(null);
                setSuccess(null);
                setFile(f);
              }}
            />

            {file ? (
              <span className="text-slate-700 dark:text-slate-200">
                Fichier sélectionné : <span className="font-semibold">{file.name}</span>
              </span>
            ) : (
              "Clique pour importer une photo (image)"
            )}
          </label>
        </div>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        {success && <p className="text-sm font-semibold text-emerald-600">{success}</p>}

        <Button disabled={!canSubmit} onClick={onSubmit}>
          {submitting ? "Envoi en cours…" : "Envoyer le ticket"}
        </Button>
      </Card>

      {/* ✅ LISTE EN BAS */}
      <Card className="grid gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Mes tickets envoyés
          </h2>

          <Button onClick={refreshTickets} disabled={loadingTickets}>
            {loadingTickets ? "Actualisation…" : "Rafraîchir"}
          </Button>
        </div>

        {loadingTickets && tickets.length === 0 ? (
          <p className="text-sm text-slate-500">Chargement des tickets…</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun ticket envoyé pour l’instant.</p>
        ) : (
          <div className="grid gap-4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="grid gap-3 rounded-3xl border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-[140px_1fr]"
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.imageUrl}
                    alt={`Ticket ${t.title}`}
                    className="h-32 w-full object-cover"
                  />
                </div>

                <div className="grid gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {t.title || "Sans titre"}
                    </p>

                    <Button onClick={() => onDelete(t)} disabled={deletingId === t.id}>
                      {deletingId === t.id ? "Suppression…" : "Supprimer"}
                    </Button>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Enseigne : <span className="font-semibold">{t.store || "—"}</span>
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Date : <span className="font-semibold">{formatDate(t.createdAt)}</span>
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Statut : <span className="font-semibold">{t.status ?? "submitted"}</span>
                  </p>

                  {t.imageUrl && (
                    <a
                      href={t.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 text-sm font-semibold text-emerald-600 hover:underline"
                    >
                      Ouvrir l’image en grand
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
