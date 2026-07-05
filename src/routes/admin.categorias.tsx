import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/categorias")({
  head: () => ({ meta: [{ title: "Categorias — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  if (loading || isAdmin === null) return <FullPageLoader />;
  if (!user || !isAdmin) return null;
  return (
    <AdminShell active="categorias" title="Categorias" subtitle="Organize os serviços por categoria.">
      <Panel><p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p></Panel>
    </AdminShell>
  );
}
