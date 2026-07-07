import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Users, Wifi } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/clientes-online")({
  head: () => ({
    meta: [
      { title: "Clientes Online — Painel Admin | Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientesOnlinePage,
});

type Cliente = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  created_at: string;
  last_seen: string | null;
};

type OrderKey = "online" | "recente" | "antigo" | "nome";

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

const ONLINE_WINDOW_MS = 2 * 60_000; // considerado online se last_seen < 2 min

function ClientesOnlinePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  const [q, setQ] = useState("");
  const [ord, setOrd] = useState<OrderKey>("online");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  // Tick a cada 15s para re-avaliar quem está online e atualizar "há X min"
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  const { data: clientes = [], refetch } = useQuery({
    queryKey: ["admin", "clientes-online"],
    enabled: !!user && isAdmin === true,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, telefone, created_at, last_seen")
        .eq("tipo_usuario", "cliente")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  // Refetch em tempo real quando algum perfil atualiza `last_seen`
  useEffect(() => {
    if (!user || isAdmin !== true) return;
    const channel = supabase
      .channel("profiles-last-seen")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
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
      clientes.map((c) => ({
        ...c,
        isOnline: c.last_seen
          ? now - new Date(c.last_seen).getTime() < ONLINE_WINDOW_MS
          : false,
      })),
    [clientes, now],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = enriched.filter(
      (c) =>
        !term ||
        (c.nome ?? "").toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term),
    );
    if (ord === "online") {
      r = [...r].sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else if (ord === "recente") {
      r = [...r].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (ord === "antigo") {
      r = [...r].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    } else if (ord === "nome") {
      r = [...r].sort((a, b) =>
        (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR", { sensitivity: "base" }),
      );
    }
    return r;
  }, [enriched, q, ord]);

  const totalOnline = enriched.filter((c) => c.isOnline).length;

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell
      active="clientes-online"
      title="Clientes Online"
      subtitle="Veja em tempo real quem está ativo na plataforma"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total de clientes
              </p>
              <p className="mt-0.5 text-2xl font-bold text-[#0A1128]">{enriched.length}</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ background: "rgba(15,169,138,0.15)", color: TEAL }}
            >
              <Wifi className="h-5 w-5" />
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
      </div>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9"
            />
          </div>
          <Select value={ord} onValueChange={(v) => setOrd(v as OrderKey)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Online primeiro</SelectItem>
              <SelectItem value="recente">Cadastro mais recente</SelectItem>
              <SelectItem value="antigo">Cadastro mais antigo</SelectItem>
              <SelectItem value="nome">Nome (A–Z)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              setOrd("online");
            }}
            className="text-slate-500"
          >
            Limpar
          </Button>
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="-mx-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-3 py-3 font-semibold">Contato</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Cadastro</th>
                <th className="px-6 py-3 font-semibold">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const initials = (r.nome ?? "?")
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <tr key={r.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">
                            {initials || "?"}
                          </div>
                          <span
                            aria-label={r.isOnline ? "online" : "offline"}
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                              r.isOnline ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                        </div>
                        <p className="font-medium text-[#0A1128]">{r.nome ?? "Sem nome"}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">
                      <div>{r.email ?? "—"}</div>
                      {r.telefone && (
                        <div className="text-xs text-slate-400">{r.telefone}</div>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
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
                    <td className="px-3 py-3.5 text-slate-600">{fmtDateTime(r.created_at)}</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {r.isOnline ? (
                        <span className="text-emerald-600">Ativo agora</span>
                      ) : (
                        <div>
                          <div>{fmtDateTime(r.last_seen)}</div>
                          <div className="text-xs text-slate-400">{relativeTime(r.last_seen)}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </AdminShell>
  );
}
