"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase/client";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setSubmitting(false);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/");
    } catch (err: unknown) {
      const code = err instanceof FirebaseError ? err.code : undefined;
      setError(
        code === "auth/email-already-in-use"
          ? "Cet email est deja utilise."
          : "Inscription impossible. Verifie les informations."
      );
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
      <Input
        label="Confirmer le mot de passe"
        type="password"
        placeholder="********"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creation..." : "Creer mon compte"}
      </Button>
    </form>
  );
}
