"use client";

import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase/client";
import { Button } from "../ui/Button";

export function LogoutButton() {
  return (
    <Button
      variant="secondary"
      type="button"
      onClick={() => {
        void signOut(auth);
      }}
    >
      Déconnexion
    </Button>
  );
}
