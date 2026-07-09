import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Globe, Search, Trash2, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, TEAL } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/visitantes")({
  head: () => ({
    meta: [
      { title: "Visitantes ao vivo — Painel Admin | Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VisitantesPage,
});

type Row = {
  session_id: string;
  user_id: string | null;
  path: string | null;
  referrer: string | null;
  user_agent: string | null;
  first_seen: string;
  last_seen: string;
};

type Filtro = "todos" | "online" | "anonimos" | "logados";

const ONLINE_WINDOW_MS = 2 * 60_000;
const RETENTION_HOURS = 24;

function relative(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

function deviceFromUA(ua: string | null): string {
  if (!ua) return "—";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "Mobile";
  if (/tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}

function browserFromUA(ua: string | null): string {
  if (!ua) return "—";
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return "Outro";
}

function VisitantesPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [now, setNow] = useState(() => Date.now());
  const [toDelete, setToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(t);
  }, []);

  const { data: rows = [], refetch } = useQuery({
    queryKey: ["admin", "visitantes"],
    enabled: !!user && isAdmin === true,
    refetchInterval: 15_000,
    queryFn: async () => {
      const since = new Date(Date.now() - RETENTION_HOURS * 3_600_000).toISOString();
      const { data, error } = await supabase
        .from("visitantes")
        .select("session_id, user_id, path, referrer, user_agent, first_seen, last_seen")
        .gte("last_seen", since)
        .order("last_seen", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  useEffect(() => {
    if (!user || isAdmin !== true) return;
    const channel = supabase
      .channel("visitantes-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visitantes" },
        () => {
          void refetch();
          setNow(Date.now());
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, refetch]);

  const enriched = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        isOnline: now - new Date(r.last_seen).getTime() < ONLINE_WINDOW_MS,
      })),
    [rows, now],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return enriched.filter((r) => {
      if (filtro === "online" && !r.isOnline) return false;
      if (filtro === "anonimos" && r.user_id) return false;
      if (filtro === "logados" && !r.user_id) return false;
      if (!term) return true;
      return (
        (r.path ?? "").toLowerCase().includes(term) ||
        (r.referrer ?? "").toLowerCase().includes(term) ||
        (r.user_agent ?? "").toLowerCase().includes(term)
      );
    });
  }, [enriched, q, filtro]);

  const totalOnline = enriched.filter((r) => r.isOnline).length;
  const anonimos = enriched.filter((r) => r.isOnline && !r.user_id).length;
  const logados = enriched.filter((r) => r.isOnline && r.user_id).length;

  const handleDelete = async () => {
    if (!toDelete) return;
    const id = toDelete;
    setToDelete(null);
    const { error } = await supabase.from("visitantes").delete().eq("session_id", id);
    if (error) {
      toast.error("Erro ao excluir visitante.");
      return;
    }
    toast.success("Visitante removido.");
    void qc.invalidateQueries({ queryKey: ["admin", "visitantes"] });
  };

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell
      active="visitantes"
      title="Visitantes ao vivo"
      subtitle="Acompanhe em tempo real quem está navegando no site"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <Panel>
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ background: "rgba(15,169,138,0.15)", color: TEAL }}
            >
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Online agora
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-2xl font-bold text-[#0A1128]">
                {totalOnline}
                <span className="relative inline-flex h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Logados
              </p>
              <p className="mt-0.5 text-2xl font-bold text-[#0A1128]">{logados}</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Anônimos
              </p>
              <p className="mt-0.5 text-2xl font-bold text-[#0A1128]">{anonimos}</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por página, origem ou dispositivo..."
              className="pl-9"
            />
          </div>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos (últimas 24h)</SelectItem>
              <SelectItem value="online">Online agora</SelectItem>
              <SelectItem value="logados">Somente logados</SelectItem>
              <SelectItem value="anonimos">Somente anônimos</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              setFiltro("todos");
            }}
            className="text-slate-500"
          >
            Limpar
          </Button>
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="-mx-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Página atual</th>
                <th className="px-3 py-3 font-semibold">Origem</th>
                <th className="px-3 py-3 font-semibold">Dispositivo</th>
                <th className="px-3 py-3 font-semibold">Tipo</th>
                <th className="px-3 py-3 font-semibold">Última atividade</th>
                <th className="px-6 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Nenhum visitante encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.session_id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.isOnline
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          r.isOnline ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {r.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-3.5 font-medium text-[#0A1128]">
                    {r.path ?? "—"}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-3.5 text-slate-600">
                    {r.referrer || <span className="text-slate-400">Direto</span>}
                  </td>
                  <td className="px-3 py-3.5 text-slate-600">
                    <div>{deviceFromUA(r.user_agent)}</div>
                    <div className="text-xs text-slate-400">{browserFromUA(r.user_agent)}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.user_id
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.user_id ? "Logado" : "Anônimo"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-slate-600">{relative(r.last_seen, now)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete(r.session_id)}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir visitante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o registro deste visitante da lista. Se ele continuar navegando,
              aparecerá novamente na próxima atividade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
