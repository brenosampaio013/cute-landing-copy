import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Waves,
  LayoutDashboard,
  Calendar,
  LayoutGrid,
  Users,
  UserCircle,
  CreditCard,
  Star,
  MessageSquare,
  Ticket,
  FileBarChart,
  UserCog,
  Tag,
  Settings,
  Bell,
  ScrollText,
  HelpCircle,
  Search,
  Plus,
  Eye,
  MoreVertical,
  ChevronDown,
  ArrowUpRight,
  DollarSign,
  Home as HomeIcon,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { useProfile } from "@/hooks/queries/use-profile";
import { useAdminDashboard } from "@/hooks/queries/use-admin-dashboard";
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

/* ---------- design tokens ---------- */
const NAVY = "#0A1128";
const NAVY_2 = "#0D1B3D";
const TEAL = "#0FA98A";
const TEAL_SOFT = "rgba(15,169,138,0.15)";

/* ---------- sidebar data ---------- */
type NavItem = { label: string; icon: LucideIcon; active?: boolean };

const PRINCIPAL: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Agendamentos", icon: Calendar },
  { label: "Serviços", icon: LayoutGrid },
  { label: "Profissionais", icon: Users },
  { label: "Clientes", icon: UserCircle },
  { label: "Pagamentos", icon: CreditCard },
  { label: "Avaliações", icon: Star },
  { label: "Mensagens", icon: MessageSquare },
  { label: "Cupons", icon: Ticket },
  { label: "Relatórios", icon: FileBarChart },
];

const GERENCIAMENTO: NavItem[] = [
  { label: "Usuários", icon: UserCog },
  { label: "Categorias", icon: Tag },
  { label: "Configurações", icon: Settings },
  { label: "Notificações", icon: Bell },
  { label: "Logs do sistema", icon: ScrollText },
];

const DONUT_COLORS: Record<string, string> = {
  concluido: NAVY_2,
  confirmado: TEAL,
  pendente: "#F5B841",
  cancelado: "#EF4444",
};

const BAR_COLORS = ["#3B82F6", TEAL, "#F5B841", "#8B5CF6"];
const AVATAR_COLORS = ["#F472B6", "#60A5FA", "#FBBF24", "#34D399"];

const TABS = ["Todos", "Pendentes", "Confirmados", "Concluídos", "Cancelados"] as const;

/* ---------- helpers ---------- */
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusBadge: Record<string, string> = {
  Confirmado: "bg-emerald-100 text-emerald-700",
  Concluído: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-amber-100 text-amber-700",
  Cancelado: "bg-rose-100 text-rose-700",
};
const pagamentoBadge: Record<string, string> = {
  Pago: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-amber-100 text-amber-700",
  Estornado: "bg-rose-100 text-rose-700",
};

/* ---------- component ---------- */
function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const { displayName, initial } = useProfile();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Todos");

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const { data, isLoading } = useAdminDashboard(isAdmin === true);

  const filteredRows = useMemo(() => {
    const rows = data?.tabela ?? [];
    if (activeTab === "Todos") return rows;
    const target = activeTab.replace(/s$/, "");
    return rows.filter((r) => r.status === target);
  }, [activeTab, data]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  const kpi = data?.kpi;
  const line = data?.line ?? [];
  const donut = data?.donut ?? [];
  const donutTotal = donut.reduce((s, d) => s + d.value, 0);
  const recentes = data?.recentes ?? [];
  const bar = data?.bar ?? [];
  const topServicos = data?.topServicos ?? [];
  const cadastros = data?.cadastros ?? [];
  const fin = data?.financeiro;

  return (
    <AdminShell active="dashboard" title="Dashboard">


        {/* KPIs */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Agendamentos" sub="(hoje)" value={isLoading ? "…" : String(kpi?.hoje ?? 0)} icon={Calendar} tint="bg-blue-100 text-blue-600" />
          <KpiCard label="Faturamento" sub="(mês)" value={isLoading ? "…" : brl(kpi?.faturamentoMes ?? 0)} icon={DollarSign} tint="bg-emerald-100 text-emerald-600" />
          <KpiCard label="Profissionais ativos" value={isLoading ? "…" : String(kpi?.profissionaisAtivos ?? 0)} icon={Users} tint="bg-violet-100 text-violet-600" />
          <KpiCard
            label="Avaliação média"
            value={isLoading ? "…" : kpi?.avaliacaoMedia != null ? kpi.avaliacaoMedia.toFixed(1).replace(".", ",") : "—"}
            icon={Star}
            tint="bg-amber-100 text-amber-600"
          />
        </div>

        {/* ROW: line + donut + list */}
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.7fr_1fr_1fr]">
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#0A1128]">Agendamentos</h3>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                Últimos 7 dias
              </span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={line} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={NAVY_2} stopOpacity={0.25} /><stop offset="100%" stopColor={NAVY_2} stopOpacity={0} /></linearGradient>
                    <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TEAL} stopOpacity={0.25} /><stop offset="100%" stopColor={TEAL} stopOpacity={0} /></linearGradient>
                    <linearGradient id="g3" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" name="Concluídos" dataKey="concluidos" stroke={NAVY_2} strokeWidth={2} fill="url(#g1)" />
                  <Area type="monotone" name="Confirmados" dataKey="confirmados" stroke={TEAL} strokeWidth={2} fill="url(#g2)" />
                  <Area type="monotone" name="Cancelados" dataKey="cancelados" stroke="#EF4444" strokeWidth={2} fill="url(#g3)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-4 font-semibold text-[#0A1128]">Agendamentos por status</h3>
            <div className="flex items-center gap-4">
              <div className="h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                      {donut.map((d) => <Cell key={d.key} fill={DONUT_COLORS[d.key]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-2 text-xs">
                {donut.map((d) => {
                  const pct = donutTotal ? Math.round((d.value / donutTotal) * 100) : 0;
                  return (
                    <li key={d.key} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT_COLORS[d.key] }} />
                      <div className="min-w-0">
                        <p className="font-medium text-[#0A1128]">{d.name}</p>
                        <p className="text-slate-500">{pct}% ({d.value})</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Panel>

          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-[#0A1128]">Agendamentos recentes</h3>
              <span className="text-xs font-medium" style={{ color: TEAL }}>Ver todos</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {recentes.length === 0 && !isLoading && (
                <li className="py-6 text-center text-xs text-slate-400">Sem agendamentos</li>
              )}
              {recentes.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <HomeIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0A1128]">{r.servico}</p>
                    <p className="truncate text-xs text-slate-500">{r.cliente}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge[r.status]}`}>{r.status}</span>
                    <p className="mt-0.5 text-[11px] text-slate-500">{r.hora}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* TABLE */}
        <Panel className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <h3 className="font-semibold text-[#0A1128]">Agendamentos</h3>
              <div className="flex flex-wrap gap-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      activeTab === t ? "bg-[#0A1128] text-white" : "text-slate-500 hover:text-[#0A1128]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white" style={{ background: "#3B82F6" }}>
              <Plus className="h-3.5 w-3.5" /> Novo agendamento
            </button>
          </div>

          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Serviço</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Profissional</th>
                  <th className="px-4 py-3 font-semibold">Data e hora</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Pagamento</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-6 py-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-medium text-slate-500">{r.id}</td>
                    <td className="px-4 py-3.5 font-medium text-[#0A1128]">{r.servico}</td>
                    <td className="px-4 py-3.5 text-slate-600">{r.cliente}</td>
                    <td className="px-4 py-3.5 text-slate-600">{r.profissional}</td>
                    <td className="px-4 py-3.5 text-slate-600">{r.data}</td>
                    <td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[r.status]}`}>{r.status}</span></td>
                    <td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pagamentoBadge[r.pagamento]}`}>{r.pagamento}</span></td>
                    <td className="px-4 py-3.5 font-medium text-[#0A1128]">{brl(r.valor)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <button className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]"><Eye className="h-4 w-4" /></button>
                        <button className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]"><MoreVertical className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500">
                    {isLoading ? "Carregando…" : "Nenhum agendamento neste filtro."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* BOTTOM ROW */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <Panel>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-500">Faturamento</h3>
                <p className="mt-1 text-2xl font-bold text-[#0A1128]">{brl(kpi?.faturamentoMes ?? 0)}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" /> Mês atual
                </p>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bar} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} formatter={(v: number) => brl(v)} />
                  <Bar dataKey="v" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-4 font-semibold text-[#0A1128]">Top serviços</h3>
            <ul className="space-y-4">
              {topServicos.length === 0 && !isLoading && (
                <li className="py-6 text-center text-xs text-slate-400">Sem dados ainda</li>
              )}
              {topServicos.map((s, i) => {
                const max = topServicos[0]?.valor || 1;
                const pct = max ? (s.valor / max) * 100 : 0;
                return (
                  <li key={s.nome} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#0A1128]">{s.nome}</p>
                          <p className="text-[11px] text-slate-500">{s.qtd} agendamentos</p>
                        </div>
                        <p className="ml-3 text-sm font-semibold text-[#0A1128]">{brl(s.valor)}</p>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#0A1128]">Resumo financeiro</h3>
              <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">Este mês</span>
            </div>
            <ul className="space-y-3.5 text-sm">
              <li className="flex justify-between"><span className="text-slate-500">Faturamento bruto</span><span className="font-semibold text-[#0A1128]">{brl(fin?.bruto ?? 0)}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Taxas da plataforma (-)</span><span className="font-semibold text-rose-500">- {brl(fin?.taxas ?? 0)}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Repasses a profissionais (-)</span><span className="font-semibold text-rose-500">- {brl(fin?.repasses ?? 0)}</span></li>
              <li className="mt-2 flex justify-between border-t border-slate-100 pt-3.5">
                <span className="font-semibold text-[#0A1128]">Faturamento líquido</span>
                <span className="text-lg font-bold" style={{ color: TEAL }}>{brl(fin?.liquido ?? 0)}</span>
              </li>
            </ul>
          </Panel>
        </div>

        {/* CADASTROS RECENTES */}
        <Panel className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#0A1128]">Cadastros recentes</h3>
            <span className="text-xs font-medium" style={{ color: TEAL }}>Ver todos</span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cadastros.length === 0 && !isLoading && (
              <li className="col-span-full py-6 text-center text-xs text-slate-400">Sem cadastros</li>
            )}
            {cadastros.map((c, i) => (
              <li key={c.nome + i} className="flex items-center gap-3 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {c.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#0A1128]">{c.nome}</p>
                  <p className="text-xs text-slate-500">{c.tipo}</p>
                </div>
                <span className="text-[11px] text-slate-400">{c.data}</span>
              </li>
            ))}
          </ul>
        </Panel>

      <div className="mt-8 flex justify-end">
        <Link to="/dashboard" className="text-xs text-slate-400 hover:text-[#0A1128]">← Voltar ao dashboard do cliente</Link>
      </div>
    </AdminShell>
  );
}


/* ---------- primitives ---------- */
function SidebarSection({ title, items, className = "" }: { title: string; items: NavItem[]; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 px-4 text-[10px] font-semibold tracking-[0.16em] text-white/40">{title}</p>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.label}>
            <button
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                it.active
                  ? "text-white shadow-inner"
                  : "text-white/65 hover:bg-white/[0.06] hover:text-white"
              }`}
              style={it.active ? { background: TEAL_SOFT, boxShadow: `inset 0 0 0 1px ${TEAL}55` } : undefined}
            >
              <it.icon className="h-[18px] w-[18px]" style={it.active ? { color: TEAL } : undefined} />
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 ${className}`}>
      {children}
    </div>
  );
}

function KpiCard({
  label, sub, value, icon: Icon, tint,
}: {
  label: string; sub?: string; value: string; icon: LucideIcon; tint: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}{sub && <span className="ml-1 text-slate-400">{sub}</span>}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
