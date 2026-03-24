"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase/client";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuth } from "../providers/AuthProvider";
import { isAdminEmail } from "../../lib/admin";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (isAdminEmail(user.email)) {
      router.replace("/admin/offers");
      return;
    }
    router.replace("/");
  }, [loading, user, router]);

  const mapAuthError = (code?: string) => {
    switch (code) {
      case "auth/invalid-email":
        return "Email invalide.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email ou mot de passe incorrect.";
      case "auth/too-many-requests":
        return "Trop de tentatives. Réessaie dans quelques minutes.";
      default:
        return "Connexion impossible. Vérifie tes identifiants.";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const next = searchParams.get("next");
      const nextSafe = next && next.startsWith("/") ? next : null;

      if (isAdminEmail(credential.user.email)) {
        router.replace(nextSafe ?? "/admin/offers");
      } else {
        router.replace(nextSafe ?? "/");
      }
    } catch (err: unknown) {
      const code = err instanceof FirebaseError ? err.code : undefined;
      setError(mapAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        placeholder="vous@exemple.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        label="Mot de passe"
        type="password"
        placeholder="********"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
