import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Calendar, Users, Wallet, BarChart3, Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { useLogout } from "@/hooks/use-logout";
import { FullPageLoader } from "@/components/full-page-loader";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPanel,
});

type Agendamento = {
  id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  servico: string;
  status: string;
  cliente_id: string;
  profissional_id: string | null;
};

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  tipo_usuario: string;
  created_at: string;
};

type Pagamento = { valor: number; status: string; created_at: string };

type Tab = "agendamentos" | "clientes" | "profissionais" | "metricas";

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  confirmado: "bg-blue-100 text-blue-800",
  concluido: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-rose-100 text-rose-800",
};

function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const handleLogout = useLogout("/");
  const [tab, setTab] = useState<Tab>("agendamentos");

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [busy, setBusy] = useState(true);

  // Guarda de acesso: sem sessão → /login; autenticado mas não-admin → /dashboard
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (isAdmin === false) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      const [ag, pr, pg] = await Promise.all([
        supabase.from("agendamentos").select("*").order("data", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("pagamentos").select("valor,status,created_at"),
      ]);
      if (cancelled) return;
      setAgendamentos((ag.data as Agendamento[]) ?? []);
      setProfiles((pr.data as Profile[]) ?? []);
      setPagamentos((pg.data as Pagamento[]) ?? []);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);


  const clientes = useMemo(() => profiles.filter((p) => p.tipo_usuario === "cliente"), [profiles]);
  const profissionais = useMemo(
    () => profiles.filter((p) => p.tipo_usuario === "profissional"),
    [profiles],
  );
  const nomeById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.nome || p.email || p.id.slice(0, 8)));
    return m;
  }, [profiles]);

  const metrics = useMemo(() => {
    const receita = pagamentos
      .filter((p) => p.status === "pago")
      .reduce((s, p) => s + Number(p.valor || 0), 0);
    const pendentes = pagamentos.filter((p) => p.status === "pendente").length;
    const porStatus = agendamentos.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    return { receita, pendentes, porStatus };
  }, [pagamentos, agendamentos]);

  async function updateStatus(id: string, status: "pendente" | "confirmado" | "concluido" | "cancelado") {
    const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
    if (!error) {
      setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    }
  }

  if (loading || !user || isAdmin === null || isAdmin === false) {
    return <FullPageLoader />;
  }



  const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "agendamentos", label: "Agendamentos", icon: Calendar },
    { key: "clientes", label: "Clientes", icon: Users },
    { key: "profissionais", label: "Profissionais", icon: Users },
    { key: "metricas", label: "Métricas", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="border-b border-slate-200 bg-[#0A1A2F] px-6 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#2DD4BF]" />
            <div>
              <h1 className="font-display text-xl">Painel Admin</h1>
              <p className="text-xs text-white/60">Maré Nobre</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-[#2DD4BF] text-[#0A1A2F]"
                    : "border-transparent text-slate-500 hover:text-[#0A1A2F]"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {busy ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : tab === "agendamentos" ? (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Horário</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Profissional</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agendamentos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhum agendamento.
                    </td>
                  </tr>
                )}
                {agendamentos.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{new Date(a.data).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      {a.horario_inicio.slice(0, 5)} – {a.horario_fim.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">{a.servico}</td>
                    <td className="px-4 py-3">{nomeById.get(a.cliente_id) ?? "—"}</td>
                    <td className="px-4 py-3">
                      {a.profissional_id ? nomeById.get(a.profissional_id) ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as "pendente" | "confirmado" | "concluido" | "cancelado")}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <option value="pendente">pendente</option>
                        <option value="confirmado">confirmado</option>
                        <option value="concluido">concluido</option>
                        <option value="cancelado">cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === "clientes" ? (
          <UsersTable rows={clientes} />
        ) : tab === "profissionais" ? (
          <UsersTable rows={profissionais} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<Wallet className="h-5 w-5 text-emerald-600" />}
              label="Receita (paga)"
              value={metrics.receita.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />
            <MetricCard
              icon={<Calendar className="h-5 w-5 text-blue-600" />}
              label="Agendamentos"
              value={agendamentos.length.toString()}
            />
            <MetricCard
              icon={<Users className="h-5 w-5 text-indigo-600" />}
              label="Clientes"
              value={clientes.length.toString()}
            />
            <MetricCard
              icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
              label="Pagamentos pendentes"
              value={metrics.pendentes.toString()}
            />
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:col-span-2 lg:col-span-4">
              <h3 className="mb-3 text-sm font-semibold text-[#0A1A2F]">Agendamentos por status</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(metrics.porStatus).map(([k, v]) => (
                  <span
                    key={k}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_COLORS[k] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {k}: {v}
                  </span>
                ))}
                {Object.keys(metrics.porStatus).length === 0 && (
                  <span className="text-sm text-slate-500">Sem dados.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-[#0A1A2F]">{value}</p>
    </div>
  );
}

function UsersTable({ rows }: { rows: Profile[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Telefone</th>
            <th className="px-4 py-3">Cadastro</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                Nenhum registro.
              </td>
            </tr>
          )}
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-[#0A1A2F]">{p.nome || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{p.email || "—"}</td>
              <td className="px-4 py-3 text-slate-600">{p.telefone || "—"}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(p.created_at).toLocaleDateString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
