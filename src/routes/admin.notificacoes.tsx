import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user);
  if (loading || isLoading) return <FullPageLoader />;
  if (!user || !isAdmin) return null;
  return (
    <AdminShell active="notificacoes" title="Notificações" subtitle="Central de notificações.">
      <Panel><p className="text-sm text-slate-500">Nenhuma notificação.</p></Panel>
    </AdminShell>
  );
}
