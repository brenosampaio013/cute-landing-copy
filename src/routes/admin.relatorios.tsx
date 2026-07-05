import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, FileSpreadsheet, TrendingUp, TrendingDown, Calendar as CalendarIcon, Loader2 } from "lucide-react";
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
import { useRelatorios, type Periodo } from "@/hooks/queries/use-relatorios";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: RelatoriosPage,
});

const AMBER = "#F5B301";
const RED = "#E11D48";
const CHART_COLORS = [NAVY, TEAL, AMBER, RED, "#6366F1"];
const PERIODO_LABEL: Record<Periodo, string> = {
  hoje: "Hoje", "7d": "Últimos 7 dias", mes: "Este mês",
  "3m": "Últimos 3 meses", ano: "Este ano", custom: "Personalizado",
};
const currency = (n: number) => brl(Math.round(n));

function RelatoriosPage() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [range, setRange] = useState<DateRange | undefined>();
  const { data, isLoading, error } = useRelatorios(periodo, { from: range?.from, to: range?.to });

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
      {error && <Panel><p className="text-sm text-rose-600">Erro ao carregar relatórios: {(error as Error).message}</p></Panel>}
      {isLoading || !data ? (
        <div className="flex h-[400px] items-center justify-center rounded-xl bg-white ring-1 ring-slate-100">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <Tabs defaultValue="visao">
          <TabsList className="mb-6 flex-wrap bg-white p-1 shadow-sm ring-1 ring-slate-100">
            <TabsTrigger value="visao">Visão geral</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="visao"><VisaoGeral d={data} /></TabsContent>
          <TabsContent value="financeiro"><Financeiro d={data} /></TabsContent>
          <TabsContent value="agendamentos"><Agendamentos d={data} /></TabsContent>
          <TabsContent value="profissionais"><Profissionais d={data} /></TabsContent>
          <TabsContent value="clientes"><Clientes d={data} /></TabsContent>
        </Tabs>
      )}
    </AdminShell>
  );
}

type D = NonNullable<ReturnType<typeof useRelatorios>["data"]>;

function Kpi({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const up = (delta ?? 0) >= 0;
  return (
    <Panel className="!p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p>
      {delta !== undefined && (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {up ? "+" : ""}{delta.toFixed(1)}% vs período anterior
        </p>
      )}
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
function DataTable({ columns, rows, empty = "Sem dados no período." }: { columns: string[]; rows: Array<Array<string | number>>; empty?: string }) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-slate-500">{empty}</p>;
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

function VisaoGeral({ d }: { d: D }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento do período" value={currency(d.kpis.faturamento.valor)} delta={d.kpis.faturamento.delta} />
        <Kpi label="Total de agendamentos" value={String(d.kpis.agendamentos.valor)} delta={d.kpis.agendamentos.delta} />
        <Kpi label="Novos clientes" value={String(d.kpis.clientesNovos.valor)} delta={d.kpis.clientesNovos.delta} />
        <Kpi label="Avaliação média" value={d.kpis.notaMedia.valor.toFixed(1).replace(".", ",")} delta={d.kpis.notaMedia.delta} />
      </div>

      <ChartCard title="Faturamento vs Agendamentos">
        <ResponsiveContainer>
          <LineChart data={d.serie}>
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
              <Pie data={d.status} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {d.status.map((s) => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top 5 serviços por faturamento">
          <ResponsiveContainer>
            <BarChart data={d.topServicos} layout="vertical" margin={{ left: 10 }}>
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
          rows={d.resumo.map((r) => [r.periodo, r.agendamentos, currency(r.faturamento), currency(r.ticket), `${r.cancel.toFixed(1)}%`])}
        />
      </Panel>
    </div>
  );
}

function Financeiro({ d }: { d: D }) {
  const f = d.financeiro;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento bruto" value={currency(f.bruto)} delta={d.kpis.faturamento.delta} />
        <Kpi label="Taxas retidas (12%)" value={currency(f.taxas)} />
        <Kpi label="Repasses a profissionais (70%)" value={currency(f.repasses)} />
        <Kpi label="Faturamento líquido" value={currency(f.liquido)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Faturamento por mês (últimos 12 meses)">
          <ResponsiveContainer>
            <BarChart data={f.porMes}>
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
              <Pie data={f.porCategoria} dataKey="value" nameKey="name" outerRadius={110} label>
                {f.porCategoria.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
          <Link to="/admin/pagamentos" className="text-xs font-semibold hover:underline" style={{ color: TEAL }}>
            Ver todos os pagamentos →
          </Link>
        </div>
        <DataTable
          columns={["Data", "Transações", "Bruto", "Taxas", "Repasses", "Líquido"]}
          rows={f.detalhe.map((x) => [x.data, x.tx, currency(x.bruto), currency(x.taxas), currency(x.repasses), currency(x.liquido)])}
        />
      </Panel>
    </div>
  );
}

function Agendamentos({ d }: { d: D }) {
  const a = d.agendamentosTab;
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const faixas = ["08h", "10h", "12h", "14h", "16h", "18h"];
  const max = Math.max(1, ...a.heat.flat());
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total no período" value={String(d.kpis.agendamentos.valor)} delta={d.kpis.agendamentos.delta} />
        <Kpi label="Taxa de conclusão" value={`${d.kpis.taxaConclusao.toFixed(1)}%`} />
        <Kpi label="Taxa de cancelamento" value={`${d.kpis.taxaCancelamento.toFixed(1)}%`} />
        <Kpi label="Tempo médio até confirmação" value={a.tempoConfirmacao} />
      </div>

      <ChartCard title="Agendamentos por dia">
        <ResponsiveContainer>
          <AreaChart data={a.areaSerie}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748B" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
            <Tooltip /><Legend />
            <Area type="monotone" dataKey="Concluídos" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            <Area type="monotone" dataKey="Confirmados" stackId="1" stroke={TEAL} fill={TEAL} fillOpacity={0.6} />
            <Area type="monotone" dataKey="Cancelados" stackId="1" stroke={RED} fill={RED} fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Agendamentos por serviço">
          <ResponsiveContainer>
            <BarChart data={a.porServico}>
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
                  <th className="p-2"></th>
                  {faixas.map((f) => <th key={f} className="p-2 font-semibold text-slate-600">{f}</th>)}
                </tr>
              </thead>
              <tbody>
                {dias.map((day, i) => (
                  <tr key={day}>
                    <td className="p-2 text-left font-semibold text-slate-600">{day}</td>
                    {a.heat[i].map((v, j) => {
                      const alpha = 0.1 + (v / max) * 0.9;
                      return (
                        <td key={j} className="p-1">
                          <div className="flex h-10 items-center justify-center rounded-md text-[11px] font-semibold"
                            style={{ background: `rgba(15,169,138,${alpha})`, color: alpha > 0.5 ? "#fff" : NAVY }}>
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

function Profissionais({ d }: { d: D }) {
  const p = d.profissionaisTab;
  const especialidades = d.agendPorServico;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Profissionais ativos" value={String(p.ativos)} />
        <Kpi label="Novos no período" value={String(p.novos)} />
        <Kpi label="Avaliação média" value={p.notaMedia.toFixed(1).replace(".", ",")} />
        <Kpi label="Taxa de retenção" value="—" />
      </div>

      <Panel>
        <h3 className="mb-4 text-sm font-semibold text-[#0A1128]">Top 10 profissionais</h3>
        <DataTable
          columns={["Nome", "Concluídos", "Faturamento gerado", "Avaliação"]}
          rows={p.top.map((x) => [x.nome, x.agend, currency(x.fat), x.aval ? `⭐ ${x.aval.toFixed(1)}` : "—"])}
        />
      </Panel>

      <ChartCard title="Distribuição por especialidade">
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

function Clientes({ d }: { d: D }) {
  const c = d.clientesTab;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total de clientes" value={String(c.total)} />
        <Kpi label="Novos no período" value={String(c.novos)} delta={d.kpis.clientesNovos.delta} />
        <Kpi label="Recorrentes" value={`${c.pctRecorrentes.toFixed(0)}%`} />
        <Kpi label="Ticket médio" value={currency(c.ticketMedio)} />
      </div>

      <ChartCard title="Novos clientes por mês">
        <ResponsiveContainer>
          <LineChart data={c.mensal}>
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
            rows={c.top.map((x) => [x.nome, x.agend, currency(x.gasto), x.ultimo])}
          />
        </Panel>
        <ChartCard title="Novos vs recorrentes">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={c.seg} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95}>
                <Cell fill={TEAL} /><Cell fill={NAVY} />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
