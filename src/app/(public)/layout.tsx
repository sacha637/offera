import type { ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { AdminLink } from "../../components/admin/AdminLink";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
      <AdminLink />
    </AppShell>
  );
}
