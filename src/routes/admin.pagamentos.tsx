import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Search, Eye, DollarSign, Percent, Landmark, AlertCircle, CreditCard, Banknote, QrCode, RefreshCw, type LucideIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, brl, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: PagamentosPage,
});

type Metodo = "Pix" | "Cartão de crédito" | "Boleto";
type StatusPag = "Pago" | "Pendente" | "Estornado";
type Tx = {
  id: string; agId: string; cliente: string; profissional: string;
  metodo: Metodo; valor: number; taxa: number; repasse: number;
  status: StatusPag; data: string;
};

const CLIS = ["Ana Paula Santos", "Juliana Mendes", "Carlos Alberto", "Roberto Silva", "Fernanda Costa"];
const PROFS = ["Maria Eduarda", "Carla Oliveira", "João Pedro", "Ana Paula"];
const METS: Metodo[] = ["Pix", "Cartão de crédito", "Boleto"];
const STS: StatusPag[] = ["Pago", "Pendente", "Estornado"];

const MOCK: Tx[] = Array.from({ length: 24 }, (_, i) => {
  const valor = 120 + (i * 37) % 600;
  const taxa = +(valor * 0.1).toFixed(2);
  return {
    id: `TX-${(1000 + i).toString()}`,
    agId: `#12${(80 - i).toString().padStart(2, "0")}`,
    cliente: CLIS[i % CLIS.length],
    profissional: PROFS[i % PROFS.length],
    metodo: METS[i % METS.length],
    valor, taxa, repasse: +(valor - taxa).toFixed(2),
    status: STS[i % STS.length],
    data: new Date(Date.now() - i * 86400000).toLocaleDateString("pt-BR"),
  };
});

const TABS = ["Todos", "Pagos", "Pendentes", "Estornados", "Repasses"] as const;
const badge: Record<StatusPag, string> = { Pago: "bg-emerald-100 text-emerald-700", Pendente: "bg-amber-100 text-amber-700", Estornado: "bg-rose-100 text-rose-700" };
const metodoIcon: Record<Metodo, LucideIcon> = { "Pix": QrCode, "Cartão de crédito": CreditCard, "Boleto": Banknote };

function PagamentosPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  const [tab, setTab] = useState<(typeof TABS)[number]>("Todos");
  const [q, setQ] = useState(""); const [met, setMet] = useState("all"); const [de, setDe] = useState(""); const [ate, setAte] = useState("");
  const [detail, setDetail] = useState<Tx | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const filtered = useMemo(() => MOCK.filter((r) => {
    if (tab === "Pagos" && r.status !== "Pago") return false;
    if (tab === "Pendentes" && r.status !== "Pendente") return false;
    if (tab === "Estornados" && r.status !== "Estornado") return false;
    if (met !== "all" && r.metodo !== met) return false;
    if (q && !r.id.toLowerCase().includes(q.toLowerCase()) && !r.cliente.toLowerCase().includes(q.toLowerCase()) && !r.agId.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tab, q, met]);

  const kpis = useMemo(() => {
    const pagos = MOCK.filter((r) => r.status === "Pago");
    const bruto = pagos.reduce((s, r) => s + r.valor, 0);
    const taxas = pagos.reduce((s, r) => s + r.taxa, 0);
    const repasses = pagos.reduce((s, r) => s + r.repasse, 0);
    const pendentes = MOCK.filter((r) => r.status !== "Pago").length;
    return { bruto, taxas, repasses, pendentes };
  }, []);

  const chart = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const day = String(d.getDate()).padStart(2, "0");
    const faturamento = 400 + ((i * 173) % 1200);
    return { d: day, Faturamento: faturamento, Repasses: Math.round(faturamento * 0.9) };
  }), []);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell active="pagamentos" title="Pagamentos" subtitle="Acompanhe transações e repasses"
      actions={<Button size="sm" variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> Exportar relatório</Button>}>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento bruto (mês)" value={brl(kpis.bruto)} icon={DollarSign} tint="bg-emerald-100 text-emerald-600" />
        <Kpi label="Taxas da plataforma" value={brl(kpis.taxas)} icon={Percent} tint="bg-blue-100 text-blue-600" />
        <Kpi label="Repasses a profissionais" value={brl(kpis.repasses)} icon={Landmark} tint="bg-fuchsia-100 text-fuchsia-600" />
        <Kpi label="Pendentes / estornos" value={String(kpis.pendentes)} icon={AlertCircle} tint="bg-amber-100 text-amber-600" />
      </div>

      <Panel className="mt-6">
        <p className="mb-3 text-sm font-semibold text-[#0A1128]">Faturamento × Repasses (30 dias)</p>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Faturamento" fill={TEAL} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Repasses" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por ID ou cliente..." className="pl-9" />
          </div>
          <Select value={met} onValueChange={setMet}><SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos métodos</SelectItem>{METS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          <div className="flex gap-2">
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <Button variant="ghost" onClick={() => { setQ(""); setMet("all"); setDe(""); setAte(""); }} className="text-slate-500">Limpar</Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${tab === t ? "bg-[#0A1128] text-white" : "text-slate-500 hover:text-[#0A1128]"}`}>{t}</button>
          ))}
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="-mx-6 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-3 py-3 font-semibold">Agendamento</th>
                <th className="px-3 py-3 font-semibold">Cliente</th>
                <th className="px-3 py-3 font-semibold">Profissional</th>
                <th className="px-3 py-3 font-semibold">Método</th>
                <th className="px-3 py-3 font-semibold text-right">Valor</th>
                <th className="px-3 py-3 font-semibold text-right">Taxa</th>
                <th className="px-3 py-3 font-semibold text-right">Repasse</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Data</th>
                <th className="px-6 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const Icon = metodoIcon[r.metodo];
                return (
                  <tr key={r.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-medium text-slate-500">{r.id}</td>
                    <td className="px-3 py-3.5 text-[#0A1128]">{r.agId}</td>
                    <td className="px-3 py-3.5 text-slate-600">{r.cliente}</td>
                    <td className="px-3 py-3.5 text-slate-600">{r.profissional}</td>
                    <td className="px-3 py-3.5"><span className="inline-flex items-center gap-1.5 text-slate-600"><Icon className="h-3.5 w-3.5" /> {r.metodo}</span></td>
                    <td className="px-3 py-3.5 text-right font-medium text-[#0A1128]">{brl(r.valor)}</td>
                    <td className="px-3 py-3.5 text-right text-slate-500">{brl(r.taxa)}</td>
                    <td className="px-3 py-3.5 text-right font-semibold" style={{ color: TEAL }}>{brl(r.repasse)}</td>
                    <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge[r.status]}`}>{r.status}</span></td>
                    <td className="px-3 py-3.5 text-slate-600">{r.data}</td>
                    <td className="px-6 py-3.5"><button onClick={() => setDetail(r)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-[#0A1128]"><Eye className="h-4 w-4" /></button></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={11} className="px-6 py-10 text-center text-sm text-slate-500">Nenhuma transação encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes da transação</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Agendamento</p>
                <p className="font-medium text-[#0A1128]">{detail.agId} · {detail.cliente}</p>
                <p className="text-xs text-slate-500">Profissional: {detail.profissional}</p>
              </div>
              <div className="space-y-2 rounded-md border border-slate-100 p-3 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Valor total</span><span className="font-medium text-[#0A1128]">{brl(detail.valor)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Taxa da plataforma</span><span className="text-rose-600">− {brl(detail.taxa)}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-2"><span className="font-medium text-slate-600">Repasse ao profissional</span><span className="font-semibold" style={{ color: TEAL }}>{brl(detail.repasse)}</span></div>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-xs">
                <span className="text-slate-500">Status do repasse</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${detail.status === "Pago" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{detail.status === "Pago" ? "Concluído" : "Processando"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button>
            <Button className="gap-1.5 text-white" style={{ background: TEAL }}><RefreshCw className="h-4 w-4" /> Reenviar comprovante</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Kpi({ label, value, icon: Icon, tint }: { label: string; value: string; icon: LucideIcon; tint: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
      <div className="flex items-start justify-between">
        <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-[#0A1128]">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
