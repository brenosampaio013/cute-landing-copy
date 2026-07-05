import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileDown, FileSpreadsheet, TrendingUp, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, brl, NAVY, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: RelatoriosPage,
});

// ---------- Paleta ----------
const AMBER = "#F5B301";
const RED = "#E11D48";
const CHART_COLORS = [NAVY, TEAL, AMBER, RED, "#6366F1"];

// ---------- Períodos ----------
type Periodo = "hoje" | "7d" | "mes" | "3m" | "ano" | "custom";
const PERIODO_LABEL: Record<Periodo, string> = {
  hoje: "Hoje", "7d": "Últimos 7 dias", mes: "Este mês",
  "3m": "Últimos 3 meses", ano: "Este ano", custom: "Personalizado",
};
const PERIODO_FATOR: Record<Periodo, number> = { hoje: 0.05, "7d": 0.35, mes: 1, "3m": 3, ano: 12, custom: 1.5 };

// ---------- Mocks base ----------
const SERVICOS = ["Limpeza", "Passadoria", "Jardinagem", "Pós-obra", "Piscina"];
const PROFISSIONAIS_NOMES = [
  "Maria Aparecida", "João Batista", "Fernanda Costa", "Roberto Silva",
  "Ana Paula Santos", "Carlos Alberto", "Larissa Alves", "Rodrigo Nunes",
  "Camila Duarte", "Bruno Lima",
];
const CLIENTES_NOMES = [
  "Ana Paula Santos", "Juliana Mendes", "Carlos Alberto", "Roberto Silva",
  "Fernanda Costa", "Beatriz Ramos", "Paulo Henrique", "Larissa Alves",
  "Rodrigo Nunes", "Camila Duarte",
];

const currency = (n: number) => brl(Math.round(n));

// ---------- Componente ----------
function RelatoriosPage() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [range, setRange] = useState<DateRange | undefined>();

  const fator = PERIODO_FATOR[periodo];

  if (loading || isAdmin === null) return <FullPageLoader />;
  if (!user || !isAdmin) return null;

  const periodoLegivel =
    periodo === "custom" && range?.from
      ? `${format(range.from, "dd/MM/yy", { locale: ptBR })}${range.to ? " – " + format(range.to, "dd/MM/yy", { locale: ptBR }) : ""}`
      : PERIODO_LABEL[periodo];

  return (
    <AdminShell
      active="relatorios"
      title="Relatórios"
      subtitle="Analise o desempenho da plataforma em detalhes"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="h-10 w-[190px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIODO_LABEL) as Periodo[]).map((k) => (
                <SelectItem key={k} value={k}>{PERIODO_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {periodo === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start gap-2 bg-white", !range && "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4" />
                  {range?.from ? periodoLegivel : "Selecionar datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          )}
          <Button variant="outline" className="h-10 gap-2 bg-white"><FileDown className="h-4 w-4" /> Exportar PDF</Button>
          <Button variant="outline" className="h-10 gap-2 bg-white"><FileSpreadsheet className="h-4 w-4" /> Exportar Excel</Button>
        </div>
      }
    >
      <Tabs defaultValue="visao">
        <TabsList className="mb-6 flex-wrap bg-white p-1 shadow-sm ring-1 ring-slate-100">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="visao"><VisaoGeral fator={fator} /></TabsContent>
        <TabsContent value="financeiro"><Financeiro fator={fator} /></TabsContent>
        <TabsContent value="agendamentos"><Agendamentos fator={fator} /></TabsContent>
        <TabsContent value="profissionais"><Profissionais fator={fator} /></TabsContent>
        <TabsContent value="clientes"><Clientes fator={fator} /></TabsContent>
      </Tabs>
    </AdminShell>
  );
}

// ---------- KPI ----------
function Kpi({ label, value, delta }: { label: string; value: string; delta: number }) {
  const up = delta >= 0;
  return (
    <Panel className="!p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p>
      <p className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {up ? "+" : ""}{delta.toFixed(1)}% vs período anterior
      </p>
    </Panel>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Panel className={className}>
      <h3 className="mb-4 text-sm font-semibold text-[#0A1128]">{title}</h3>
      <div className="h-[300px]">{children}</div>
    </Panel>
  );
}

// ============= Visão geral =============
function VisaoGeral({ fator }: { fator: number }) {
  const serie = useMemo(() => genLinhaFatAgend(fator), [fator]);
  const status = [
    { name: "Concluídos", value: Math.round(120 * fator), color: "#10B981" },
    { name: "Confirmados", value: Math.round(70 * fator), color: TEAL },
    { name: "Pendentes", value: Math.round(35 * fator), color: AMBER },
    { name: "Cancelados", value: Math.round(18 * fator), color: RED },
  ];
  const topServ = SERVICOS.map((s, i) => ({ name: s, value: Math.round((25000 - i * 3800) * fator) }))
    .sort((a, b) => b.value - a.value).slice(0, 5);
  const resumo = genResumo(fator);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento do período" value={currency(87500 * fator)} delta={12.4} />
        <Kpi label="Total de agendamentos" value={String(Math.round(243 * fator))} delta={8.7} />
        <Kpi label="Novos clientes" value={String(Math.round(58 * fator))} delta={-3.2} />
        <Kpi label="Avaliação média" value="4,8" delta={1.1} />
      </div>

      <ChartCard title="Faturamento vs Agendamentos">
        <ResponsiveContainer>
          <LineChart data={serie} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748B" }} />
            <Tooltip formatter={(v: number, n) => (n === "Faturamento" ? currency(v) : v)} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="faturamento" name="Faturamento" stroke={TEAL} strokeWidth={2.5} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="agendamentos" name="Agendamentos" stroke={NAVY} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Agendamentos por status">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={status} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {status.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top 5 serviços por faturamento">
          <ResponsiveContainer>
            <BarChart data={topServ} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12, fill: "#0A1128" }} />
              <Tooltip formatter={(v: number) => currency(v)} />
              <Bar dataKey="value" fill={TEAL} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Panel>
        <h3 className="mb-4 text-sm font-semibold text-[#0A1128]">Resumo por período</h3>
        <DataTable
          columns={["Período", "Agendamentos", "Faturamento", "Ticket médio", "Cancelamentos"]}
          rows={resumo.map((r) => [r.periodo, r.agendamentos, currency(r.faturamento), currency(r.ticket), `${r.cancel.toFixed(1)}%`])}
        />
      </Panel>
    </div>
  );
}

// ============= Financeiro =============
function Financeiro({ fator }: { fator: number }) {
  const bruto = 87500 * fator;
  const taxas = bruto * 0.12;
  const repasses = bruto * 0.7;
  const liquido = bruto - taxas - repasses;
  const meses = genMeses12(fator);
  const porCat = SERVICOS.map((s, i) => ({ name: s, value: Math.round((25000 - i * 3800) * fator) }));
  const detalhe = genResumo(fator).map((r) => ({
    data: r.periodo, tx: r.agendamentos,
    bruto: r.faturamento, taxas: r.faturamento * 0.12,
    repasses: r.faturamento * 0.7, liquido: r.faturamento * 0.18,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento bruto" value={currency(bruto)} delta={10.2} />
        <Kpi label="Taxas retidas" value={currency(taxas)} delta={9.8} />
        <Kpi label="Repasses a profissionais" value={currency(repasses)} delta={11.1} />
        <Kpi label="Faturamento líquido" value={currency(liquido)} delta={7.4} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Faturamento por mês (últimos 12 meses)">
          <ResponsiveContainer>
            <BarChart data={meses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => currency(v)} />
              <Bar dataKey="valor" fill={NAVY} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Faturamento por categoria">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={porCat} dataKey="value" nameKey="name" outerRadius={110} label>
                {porCat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => currency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Panel>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0A1128]">Detalhamento financeiro</h3>
          <Link to="/admin/pagamentos" className="text-xs font-semibold text-[color:var(--brand)] hover:underline" style={{ ["--brand" as string]: TEAL }}>
            Ver todos os pagamentos →
          </Link>
        </div>
        <DataTable
          columns={["Data", "Transações", "Bruto", "Taxas", "Repasses", "Líquido"]}
          rows={detalhe.map((d) => [d.data, d.tx, currency(d.bruto), currency(d.taxas), currency(d.repasses), currency(d.liquido)])}
        />
      </Panel>
    </div>
  );
}

// ============= Agendamentos =============
function Agendamentos({ fator }: { fator: number }) {
  const serie = genAreaAgend(fator);
  const porServ = SERVICOS.map((s, i) => ({ name: s, value: Math.round((80 - i * 12) * fator) }));
  const heat = genHeatmap(fator);
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const faixas = ["08h", "10h", "12h", "14h", "16h", "18h"];
  const max = Math.max(...heat.flat());

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total no período" value={String(Math.round(243 * fator))} delta={8.7} />
        <Kpi label="Taxa de conclusão" value="87,3%" delta={2.1} />
        <Kpi label="Taxa de cancelamento" value="6,4%" delta={-1.3} />
        <Kpi label="Tempo médio até confirmação" value="2h 15min" delta={-5.8} />
      </div>

      <ChartCard title="Agendamentos por dia">
        <ResponsiveContainer>
          <AreaChart data={serie}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="Concluídos" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            <Area type="monotone" dataKey="Confirmados" stackId="1" stroke={TEAL} fill={TEAL} fillOpacity={0.6} />
            <Area type="monotone" dataKey="Cancelados" stackId="1" stroke={RED} fill={RED} fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Agendamentos por serviço">
          <ResponsiveContainer>
            <BarChart data={porServ}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip />
              <Bar dataKey="value" fill={TEAL} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Panel>
          <h3 className="mb-4 text-sm font-semibold text-[#0A1128]">Horários de maior demanda</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-slate-500"></th>
                  {faixas.map((f) => <th key={f} className="p-2 font-semibold text-slate-600">{f}</th>)}
                </tr>
              </thead>
              <tbody>
                {dias.map((d, i) => (
                  <tr key={d}>
                    <td className="p-2 text-left font-semibold text-slate-600">{d}</td>
                    {heat[i].map((v, j) => {
                      const alpha = 0.1 + (v / max) * 0.9;
                      return (
                        <td key={j} className="p-1">
                          <div
                            className="flex h-10 items-center justify-center rounded-md text-[11px] font-semibold text-white"
                            style={{ background: `rgba(15,169,138,${alpha})`, color: alpha > 0.5 ? "#fff" : NAVY }}
                          >
                            {v}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ============= Profissionais =============
function Profissionais({ fator }: { fator: number }) {
  const top = PROFISSIONAIS_NOMES.map((n, i) => ({
    nome: n, agend: Math.round((45 - i * 3) * fator),
    fat: Math.round((12000 - i * 900) * fator), aval: (5 - i * 0.08).toFixed(1),
  }));
  const especialidades = [
    { name: "Limpeza", value: 42 }, { name: "Passadoria", value: 18 },
    { name: "Jardinagem", value: 14 }, { name: "Pós-obra", value: 9 }, { name: "Piscina", value: 7 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Profissionais ativos" value={String(Math.round(90 * Math.min(fator, 1.5)))} delta={4.5} />
        <Kpi label="Novos no período" value={String(Math.round(7 * fator))} delta={16.7} />
        <Kpi label="Avaliação média" value="4,7" delta={0.8} />
        <Kpi label="Taxa de retenção" value="92,4%" delta={2.3} />
      </div>

      <Panel>
        <h3 className="mb-4 text-sm font-semibold text-[#0A1128]">Top 10 profissionais</h3>
        <DataTable
          columns={["Nome", "Concluídos", "Faturamento gerado", "Avaliação"]}
          rows={top.map((p) => [p.nome, p.agend, currency(p.fat), `⭐ ${p.aval}`])}
        />
      </Panel>

      <ChartCard title="Distribuição por especialidade" className="!p-6">
        <ResponsiveContainer>
          <BarChart data={especialidades}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
            <Tooltip />
            <Bar dataKey="value" fill={NAVY} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ============= Clientes =============
function Clientes({ fator }: { fator: number }) {
  const mensal = genMeses12(fator).map((m) => ({ mes: m.mes, novos: Math.round(m.valor / 900) }));
  const top = CLIENTES_NOMES.map((n, i) => ({
    nome: n, agend: Math.round((22 - i * 1.6) * fator), gasto: Math.round((5400 - i * 380) * fator),
    ultimo: format(new Date(Date.now() - i * 86400000 * 3), "dd/MM/yyyy"),
  }));
  const seg = [
    { name: "Novos", value: 34 }, { name: "Recorrentes", value: 66 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total de clientes" value={String(Math.round(340 * Math.min(fator, 1.5)))} delta={6.2} />
        <Kpi label="Novos no período" value={String(Math.round(58 * fator))} delta={-3.2} />
        <Kpi label="Recorrentes" value="66%" delta={1.8} />
        <Kpi label="Ticket médio" value={currency(360)} delta={4.6} />
      </div>

      <ChartCard title="Novos clientes por mês">
        <ResponsiveContainer>
          <LineChart data={mensal}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
            <Tooltip />
            <Line type="monotone" dataKey="novos" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel>
          <h3 className="mb-4 text-sm font-semibold text-[#0A1128]">Top 10 clientes</h3>
          <DataTable
            columns={["Nome", "Agendamentos", "Total gasto", "Último"]}
            rows={top.map((c) => [c.nome, c.agend, currency(c.gasto), c.ultimo])}
          />
        </Panel>
        <ChartCard title="Novos vs recorrentes">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={seg} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                <Cell fill={TEAL} /><Cell fill={NAVY} />
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

// ============= Tabela ============
function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100">
          <tr>{columns.map((c) => <th key={c} className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              {r.map((cell, j) => <td key={j} className="py-3 pr-4 text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============= Geradores de mock ============
function genLinhaFatAgend(fator: number) {
  const n = fator < 0.5 ? 24 : fator <= 1 ? 30 : fator <= 3 ? 12 : 12;
  const unit = fator < 0.5 ? "h" : fator <= 1 ? "d" : "mês";
  return Array.from({ length: n }).map((_, i) => ({
    label: unit === "h" ? `${i}h` : unit === "d" ? `${i + 1}` : ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i],
    faturamento: Math.round((3000 + Math.sin(i / 2) * 1200 + Math.random() * 800) * (fator / n) * 30),
    agendamentos: Math.round((8 + Math.cos(i / 2) * 3 + Math.random() * 4) * (fator / n) * 30),
  }));
}
function genMeses12(fator: number) {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return meses.map((m, i) => ({ mes: m, valor: Math.round((60000 + Math.sin(i) * 15000 + i * 2000) * Math.min(fator, 1.2)) }));
}
function genAreaAgend(fator: number) {
  const n = Math.min(30, Math.max(7, Math.round(30 * Math.min(fator, 1))));
  return Array.from({ length: n }).map((_, i) => ({
    label: `${i + 1}`,
    Concluídos: Math.round(8 + Math.sin(i / 3) * 3),
    Confirmados: Math.round(4 + Math.cos(i / 4) * 2),
    Cancelados: Math.round(1 + Math.random() * 1.5),
  }));
}
function genHeatmap(fator: number) {
  return Array.from({ length: 7 }).map((_, i) =>
    Array.from({ length: 6 }).map((_, j) => {
      const peak = j === 2 || j === 3;
      const weekday = i < 5;
      return Math.round(((peak ? 12 : 5) + (weekday ? 4 : -2) + Math.random() * 3) * Math.min(fator, 1.4));
    }),
  );
}
function genResumo(fator: number) {
  const n = fator <= 1 ? 4 : 6;
  return Array.from({ length: n }).map((_, i) => {
    const agend = Math.round((60 + i * 5) * (fator / n) * 4);
    const fat = agend * 360;
    return {
      periodo: `Semana ${i + 1}`, agendamentos: agend,
      faturamento: fat, ticket: fat / Math.max(agend, 1),
      cancel: 3 + Math.random() * 4,
    };
  });
}
