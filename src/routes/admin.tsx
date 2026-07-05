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
  Sparkles,
  Wrench,
  Shirt,
  Home as HomeIcon,
  Droplet,
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

/* ---------- mock data ---------- */
const lineData = [
  { day: "13 Mai", concluidos: 12, confirmados: 8, cancelados: 3 },
  { day: "14 Mai", concluidos: 22, confirmados: 14, cancelados: 4 },
  { day: "15 Mai", concluidos: 28, confirmados: 18, cancelados: 5 },
  { day: "16 Mai", concluidos: 30, confirmados: 20, cancelados: 6 },
  { day: "17 Mai", concluidos: 34, confirmados: 22, cancelados: 5 },
  { day: "18 Mai", concluidos: 32, confirmados: 21, cancelados: 7 },
  { day: "19 Mai", concluidos: 27, confirmados: 19, cancelados: 4 },
];

const donutData = [
  { name: "Concluídos", value: 145, color: NAVY_2 },
  { name: "Confirmados", value: 70, color: TEAL },
  { name: "Pendentes", value: 25, color: "#F5B841" },
  { name: "Cancelados", value: 10, color: "#EF4444" },
];

const recentAgendamentos = [
  { icon: HomeIcon, servico: "Limpeza Residencial", cliente: "Ana Paula Santos", status: "Confirmado", hora: "Hoje, 14:00" },
  { icon: Shirt, servico: "Passadoria", cliente: "Maria Eduarda Lima", status: "Pendente", hora: "Hoje, 15:30" },
  { icon: Sparkles, servico: "Limpeza Pós-obra", cliente: "Carlos Alberto", status: "Confirmado", hora: "Hoje, 16:00" },
  { icon: Droplet, servico: "Hidráulica", cliente: "Juliana Mendes", status: "Pendente", hora: "Hoje, 17:00" },
  { icon: Sparkles, servico: "Limpeza Pesada", cliente: "Roberto Silva", status: "Cancelado", hora: "Hoje, 18:30" },
];

type Ag = {
  id: string;
  servico: string;
  cliente: string;
  profissional: string;
  data: string;
  status: "Confirmado" | "Pendente" | "Concluído" | "Cancelado";
  pagamento: "Pago" | "Pendente" | "Estornado";
  valor: number;
};

const tableRows: Ag[] = [
  { id: "#1258", servico: "Limpeza Residencial", cliente: "Ana Paula Santos", profissional: "Maria Eduarda", data: "24/05/2024 14:00", status: "Confirmado", pagamento: "Pago", valor: 150 },
  { id: "#1257", servico: "Passadoria", cliente: "Juliana Mendes", profissional: "Carla Oliveira", data: "24/05/2024 15:30", status: "Pendente", pagamento: "Pendente", valor: 80 },
  { id: "#1256", servico: "Limpeza Pós-obra", cliente: "Carlos Alberto", profissional: "Ana Paula", data: "24/05/2024 16:00", status: "Confirmado", pagamento: "Pago", valor: 250 },
  { id: "#1255", servico: "Hidráulica", cliente: "Roberto Silva", profissional: "João Pedro", data: "24/05/2024 17:00", status: "Pendente", pagamento: "Pendente", valor: 120 },
  { id: "#1254", servico: "Limpeza Pesada", cliente: "Fernanda Costa", profissional: "Maria Eduarda", data: "24/05/2024 18:30", status: "Cancelado", pagamento: "Estornado", valor: 200 },
];

const barData = Array.from({ length: 19 }, (_, i) => ({
  d: String(i + 1).padStart(2, "0"),
  v: 800 + Math.round(Math.sin(i / 2) * 900 + Math.random() * 2400),
}));

const topServicos = [
  { nome: "Limpeza Residencial", qtd: 320, valor: 15680, color: "#3B82F6" },
  { nome: "Passadoria", qtd: 180, valor: 7200, color: TEAL },
  { nome: "Limpeza Pós-obra", qtd: 120, valor: 5400, color: "#F5B841" },
  { nome: "Hidráulica", qtd: 80, valor: 3200, color: "#8B5CF6" },
];

const cadastros = [
  { nome: "Maria Eduarda Lima", tipo: "Professional", data: "23/05/2024", color: "#F472B6" },
  { nome: "João Pedro Santos", tipo: "Professional", data: "23/05/2024", color: "#60A5FA" },
  { nome: "Fernanda Costa", tipo: "Cliente", data: "23/05/2024", color: "#FBBF24" },
  { nome: "Roberto Silva", tipo: "Cliente", data: "22/05/2024", color: "#34D399" },
];

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

  const filteredRows = useMemo(() => {
    if (activeTab === "Todos") return tableRows;
    return tableRows.filter((r) => r.status === activeTab.replace(/s$/, "") || r.status + "s" === activeTab);
  }, [activeTab]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <div className="flex min-h-screen bg-[#F5F7FA] text-slate-800">
      {/* SIDEBAR */}
      <aside
        className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col text-white lg:flex"
        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_2} 100%)` }}
      >
        <div className="px-6 pb-6 pt-7">
          <div className="flex items-center gap-2">
            <Waves className="h-6 w-6" style={{ color: TEAL }} />
            <span className="text-lg font-bold tracking-wide">MARÉ NOBRE</span>
          </div>
          <p className="mt-1 text-[10px] font-medium tracking-[0.14em] text-white/45">
            SOLUÇÕES PARA O SEU LAR
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarSection title="PRINCIPAL" items={PRINCIPAL} />
          <SidebarSection title="GERENCIAMENTO" items={GERENCIAMENTO} className="mt-6" />
        </nav>

        <div className="px-3 pb-5">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: TEAL_SOFT, color: TEAL }}>
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">Precisa de ajuda?</p>
              <p className="truncate text-[11px] text-white/60">Central de ajuda</p>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-10">
        {/* HEADER */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0A1128]">Dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Bem-vindo(a) de volta, {displayName?.split(" ")[0] ?? "Admin"}! 👋
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Buscar..."
                className="h-10 w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/20"
                style={{ ["--brand" as string]: TEAL }}
              />
            </div>
            <button className="relative rounded-full bg-white p-2.5 text-slate-500 shadow-sm ring-1 ring-slate-200 hover:text-[#0A1128]">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">5</span>
            </button>
            <button className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full font-semibold text-white" style={{ background: TEAL }}>
                {initial}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#0A1128]">Admin</p>
                <p className="text-[10px] text-slate-500">Administrador</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Agendamentos" sub="(hoje)" value="24" delta="12% vs ontem" icon={Calendar} tint="bg-blue-100 text-blue-600" />
          <KpiCard label="Faturamento" sub="(mês)" value={brl(24580.5)} delta="18% vs mês anterior" icon={DollarSign} tint="bg-emerald-100 text-emerald-600" />
          <KpiCard label="Profissionais ativos" value="156" delta="8% vs mês anterior" icon={Users} tint="bg-violet-100 text-violet-600" />
          <KpiCard label="Avaliação média" value="4,8" delta="0,2 vs mês anterior" icon={Star} tint="bg-amber-100 text-amber-600" />
        </div>

        {/* ROW: line + donut + list */}
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.7fr_1fr_1fr]">
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-[#0A1128]">Agendamentos</h3>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                Últimos 7 dias <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={NAVY_2} stopOpacity={0.25} /><stop offset="100%" stopColor={NAVY_2} stopOpacity={0} /></linearGradient>
                    <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TEAL} stopOpacity={0.25} /><stop offset="100%" stopColor={TEAL} stopOpacity={0} /></linearGradient>
                    <linearGradient id="g3" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
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
                    <Pie data={donutData} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                      {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-2 text-xs">
                {donutData.map((d) => {
                  const total = donutData.reduce((s, x) => s + x.value, 0);
                  const pct = Math.round((d.value / total) * 100);
                  return (
                    <li key={d.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
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
              <a href="#" className="text-xs font-medium" style={{ color: TEAL }}>Ver todos</a>
            </div>
            <ul className="divide-y divide-slate-100">
              {recentAgendamentos.map((r, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <r.icon className="h-4 w-4" />
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
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500">Nenhum agendamento neste filtro.</td></tr>
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
                <p className="mt-1 text-2xl font-bold text-[#0A1128]">{brl(24580.5)}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" /> 18% vs mês anterior
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
                Maio/2024 <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} formatter={(v: number) => brl(v)} />
                  <Bar dataKey="v" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <a href="#" className="mt-2 inline-block text-xs font-medium" style={{ color: TEAL }}>Ver relatório completo →</a>
          </Panel>

          <Panel>
            <h3 className="mb-4 font-semibold text-[#0A1128]">Top serviços</h3>
            <ul className="space-y-4">
              {topServicos.map((s, i) => {
                const max = topServicos[0].valor;
                const pct = (s.valor / max) * 100;
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
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
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
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
                Este mês <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-3.5 text-sm">
              <li className="flex justify-between"><span className="text-slate-500">Faturamento bruto</span><span className="font-semibold text-[#0A1128]">{brl(28940)}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Taxas da plataforma (-)</span><span className="font-semibold text-rose-500">- {brl(2894)}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Repasses a profissionais (-)</span><span className="font-semibold text-rose-500">- {brl(1465.5)}</span></li>
              <li className="mt-2 flex justify-between border-t border-slate-100 pt-3.5">
                <span className="font-semibold text-[#0A1128]">Faturamento líquido</span>
                <span className="text-lg font-bold" style={{ color: TEAL }}>{brl(24580.5)}</span>
              </li>
            </ul>
          </Panel>
        </div>

        {/* CADASTROS RECENTES */}
        <Panel className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#0A1128]">Cadastros recentes</h3>
            <a href="#" className="text-xs font-medium" style={{ color: TEAL }}>Ver todos</a>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cadastros.map((c) => (
              <li key={c.nome} className="flex items-center gap-3 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ background: c.color }}>
                  {c.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
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
      </main>
    </div>
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
  label, sub, value, delta, icon: Icon, tint,
}: {
  label: string; sub?: string; value: string; delta: string; icon: LucideIcon; tint: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}{sub && <span className="ml-1 text-slate-400">{sub}</span>}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <ArrowUpRight className="h-3 w-3" /> {delta}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
