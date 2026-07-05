import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Search, MoreVertical, Copy, Pencil, Trash2, Eye, Power, PowerOff,
  Ticket, TrendingUp, DollarSign, Award, CalendarIcon, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, brl, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: CuponsPage,
});

type TipoDesconto = "percentual" | "fixo" | "frete";
type StatusCupom = "ativo" | "expirado" | "esgotado" | "inativo";

type Cupom = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: TipoDesconto;
  valor: number;
  minPedido?: number;
  descontoMax?: number;
  limiteTotal: number;
  limitePorCliente: number;
  usos: number;
  descontoTotal: number;
  ticketMedio: number;
  inicio: string; // ISO
  fim: string;    // ISO
  aplicavel: "todos" | "especificos" | "primeira";
  servicos?: string[];
  ativo: boolean;
};

const SERVICOS = ["Limpeza Residencial", "Passadoria", "Limpeza Pós-obra", "Jardinagem", "Elétrica", "Pintura"];

const hoje = new Date();
const iso = (d: Date) => d.toISOString();
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const MOCK: Cupom[] = [
  { id: "c1", codigo: "MARE10", descricao: "10% de desconto na primeira limpeza", tipo: "percentual", valor: 10, minPedido: 100, descontoMax: 50, limiteTotal: 100, limitePorCliente: 1, usos: 45, descontoTotal: 890.5, ticketMedio: 198, inicio: iso(addDays(hoje, -20)), fim: iso(addDays(hoje, 40)), aplicavel: "primeira", ativo: true },
  { id: "c2", codigo: "BEMVINDO20", descricao: "R$ 20 off para novos clientes", tipo: "fixo", valor: 20, minPedido: 80, limiteTotal: 200, limitePorCliente: 1, usos: 132, descontoTotal: 2640, ticketMedio: 154, inicio: iso(addDays(hoje, -60)), fim: iso(addDays(hoje, 30)), aplicavel: "todos", ativo: true },
  { id: "c3", codigo: "LIMPA20", descricao: "20% em serviços de limpeza", tipo: "percentual", valor: 20, minPedido: 150, descontoMax: 80, limiteTotal: 80, limitePorCliente: 2, usos: 80, descontoTotal: 3120, ticketMedio: 215, inicio: iso(addDays(hoje, -40)), fim: iso(addDays(hoje, -1)), aplicavel: "especificos", servicos: ["Limpeza Residencial", "Passadoria"], ativo: true },
  { id: "c4", codigo: "FRETEGRATIS", descricao: "Frete/deslocamento grátis", tipo: "frete", valor: 0, limiteTotal: 500, limitePorCliente: 3, usos: 210, descontoTotal: 1890, ticketMedio: 172, inicio: iso(addDays(hoje, -15)), fim: iso(addDays(hoje, 45)), aplicavel: "todos", ativo: true },
  { id: "c5", codigo: "BEMVINDO15", descricao: "15% de boas-vindas", tipo: "percentual", valor: 15, limiteTotal: 300, limitePorCliente: 1, usos: 300, descontoTotal: 5230, ticketMedio: 189, inicio: iso(addDays(hoje, -90)), fim: iso(addDays(hoje, 20)), aplicavel: "primeira", ativo: true },
  { id: "c6", codigo: "PROMO50", descricao: "R$ 50 off em reformas", tipo: "fixo", valor: 50, minPedido: 300, limiteTotal: 50, limitePorCliente: 1, usos: 12, descontoTotal: 600, ticketMedio: 420, inicio: iso(addDays(hoje, -30)), fim: iso(addDays(hoje, 60)), aplicavel: "especificos", servicos: ["Pintura"], ativo: false },
];

function computeStatus(c: Cupom): StatusCupom {
  if (!c.ativo) return "inativo";
  if (c.usos >= c.limiteTotal) return "esgotado";
  if (new Date(c.fim) < new Date()) return "expirado";
  return "ativo";
}

const STATUS_STYLE: Record<StatusCupom, string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  expirado: "bg-slate-100 text-slate-600",
  esgotado: "bg-amber-100 text-amber-700",
  inativo: "bg-rose-100 text-rose-700",
};
const STATUS_LABEL: Record<StatusCupom, string> = {
  ativo: "Ativo", expirado: "Expirado", esgotado: "Esgotado", inativo: "Inativo",
};

function CuponsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const [rows, setRows] = useState<Cupom[]>(MOCK);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const [tp, setTp] = useState("all");
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cupom | null>(null);
  const [detail, setDetail] = useState<Cupom | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const filtered = useMemo(() => rows.filter((c) => {
    const status = computeStatus(c);
    if (st !== "all" && status !== st) return false;
    if (tp !== "all" && c.tipo !== tp) return false;
    if (q && !c.codigo.toLowerCase().includes(q.toLowerCase())) return false;
    if (range.from && new Date(c.fim) < range.from) return false;
    if (range.to && new Date(c.inicio) > range.to) return false;
    return true;
  }), [rows, q, st, tp, range]);

  const kpis = useMemo(() => {
    const ativos = rows.filter((c) => computeStatus(c) === "ativo").length;
    const usosMes = rows.reduce((s, c) => s + c.usos, 0);
    const descontoMes = rows.reduce((s, c) => s + c.descontoTotal, 0);
    const mais = [...rows].sort((a, b) => b.usos - a.usos)[0];
    return { ativos, usosMes, descontoMes, mais };
  }, [rows]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  const save = (c: Cupom) => {
    setRows((rs) => (rs.some((r) => r.id === c.id) ? rs.map((r) => (r.id === c.id ? c : r)) : [c, ...rs]));
    setOpen(false); setEditing(null);
  };
  const toggle = (id: string) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ativo: !r.ativo } : r)));
  const dup = (c: Cupom) => setRows((rs) => [{ ...c, id: `c${Date.now()}`, codigo: `${c.codigo}-COPIA`, usos: 0, descontoTotal: 0 }, ...rs]);
  const del = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  return (
    <AdminShell active="cupons" title="Cupons" subtitle="Crie e gerencie cupons de desconto para seus clientes"
      actions={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5 text-white hover:opacity-90" style={{ background: "#3B82F6" }}><Plus className="h-4 w-4" /> Novo cupom</Button>}>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Cupons ativos" value={String(kpis.ativos)} icon={Ticket} tint="bg-emerald-100 text-emerald-600" />
        <Kpi label="Usos no mês" value={String(kpis.usosMes)} icon={TrendingUp} tint="bg-blue-100 text-blue-600" />
        <Kpi label="Desconto concedido" value={brl(kpis.descontoMes)} icon={DollarSign} tint="bg-amber-100 text-amber-600" />
        <Kpi label="Cupom mais usado" value={kpis.mais?.codigo ?? "—"} sub={kpis.mais ? `${kpis.mais.usos} usos` : ""} icon={Award} tint="bg-fuchsia-100 text-fuchsia-600" />
      </div>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código..." className="pl-9" />
          </div>
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="expirado">Expirado</SelectItem>
              <SelectItem value="esgotado">Esgotado</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tp} onValueChange={setTp}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="percentual">Percentual</SelectItem>
              <SelectItem value="fixo">Valor fixo</SelectItem>
              <SelectItem value="frete">Frete grátis</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !range.from && "text-slate-500")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {range.from ? (range.to ? `${format(range.from, "dd/MM/yy")} - ${format(range.to, "dd/MM/yy")}` : format(range.from, "dd/MM/yy")) : "Vigência"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range as { from: Date; to?: Date }} onSelect={(r) => setRange(r ?? {})} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" onClick={() => { setQ(""); setSt("all"); setTp("all"); setRange({}); }} className="text-slate-500">Limpar</Button>
        </div>
      </Panel>

      {/* Tabela desktop / cards mobile */}
      <Panel className="mt-6 overflow-hidden p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Desconto</th>
                <th className="px-4 py-3 min-w-[160px]">Uso</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => <Row key={c.id} c={c} onView={() => setDetail(c)} onEdit={() => { setEditing(c); setOpen(true); }} onDup={() => dup(c)} onToggle={() => toggle(c.id)} onDel={() => del(c.id)} />)}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-500">Nenhum cupom encontrado.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="grid gap-3 p-3 md:hidden">
          {filtered.map((c) => {
            const status = computeStatus(c);
            return (
              <div key={c.id} className="rounded-lg border border-slate-100 bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <CodeBadge code={c.codigo} />
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
                </div>
                <p className="text-sm text-[#0A1128]">{c.descricao}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div><dt>Desconto</dt><dd className="font-medium text-[#0A1128]">{formatDesconto(c)}</dd></div>
                  <div><dt>Uso</dt><dd className="font-medium text-[#0A1128]">{c.usos}/{c.limiteTotal}</dd></div>
                </div>
                <UsageBar usos={c.usos} limite={c.limiteTotal} className="mt-2" />
                <div className="mt-3 flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setDetail(c)}><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <CupomDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }} editing={editing} onSave={save} />
      <DetailDrawer cupom={detail} onOpenChange={(o) => !o && setDetail(null)} onEdit={(c) => { setDetail(null); setEditing(c); setOpen(true); }} onToggle={(id) => { toggle(id); setDetail(null); }} onDel={(id) => { del(id); setDetail(null); }} />
    </AdminShell>
  );
}

function Row({ c, onView, onEdit, onDup, onToggle, onDel }: { c: Cupom; onView: () => void; onEdit: () => void; onDup: () => void; onToggle: () => void; onDel: () => void }) {
  const status = computeStatus(c);
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3"><CodeBadge code={c.codigo} /></td>
      <td className="px-4 py-3 text-slate-700">{c.descricao}</td>
      <td className="px-4 py-3 text-slate-600">{c.tipo === "percentual" ? "Percentual" : c.tipo === "fixo" ? "Valor fixo" : "Frete grátis"}</td>
      <td className="px-4 py-3 font-semibold" style={{ color: TEAL }}>{formatDesconto(c)}</td>
      <td className="px-4 py-3">
        <div className="text-xs text-slate-500">{c.usos}/{c.limiteTotal}</div>
        <UsageBar usos={c.usos} limite={c.limiteTotal} className="mt-1" />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{format(new Date(c.inicio), "dd/MM/yy")} — {format(new Date(c.fim), "dd/MM/yy")}</td>
      <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span></td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-0.5">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onView}><Eye className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDup}><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>{c.ativo ? <><PowerOff className="mr-2 h-4 w-4" /> Desativar</> : <><Power className="mr-2 h-4 w-4" /> Ativar</>}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDel} className="text-rose-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

function CodeBadge({ code }: { code: string }) {
  return <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-xs font-semibold text-white">{code}</span>;
}

function formatDesconto(c: Cupom) {
  if (c.tipo === "percentual") return `${c.valor}%`;
  if (c.tipo === "fixo") return brl(c.valor);
  return "Grátis";
}

function UsageBar({ usos, limite, className }: { usos: number; limite: number; className?: string }) {
  const pct = Math.min(100, Math.round((usos / Math.max(1, limite)) * 100));
  const color = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}><div className={cn("h-full transition-all", color)} style={{ width: `${pct}%` }} /></div>;
}

function Kpi({ label, value, sub, icon: Icon, tint }: { label: string; value: string; sub?: string; icon: React.ElementType; tint: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-xl font-bold text-[#0A1128]">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tint)}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

function emptyCupom(): Cupom {
  return {
    id: `c${Date.now()}`, codigo: "", descricao: "", tipo: "percentual", valor: 10,
    limiteTotal: 100, limitePorCliente: 1, usos: 0, descontoTotal: 0, ticketMedio: 0,
    inicio: iso(hoje), fim: iso(addDays(hoje, 30)), aplicavel: "todos", ativo: true,
  };
}

function CupomDialog({ open, onOpenChange, editing, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; editing: Cupom | null; onSave: (c: Cupom) => void }) {
  const [f, setF] = useState<Cupom>(editing ?? emptyCupom());
  useEffect(() => { if (open) setF(editing ?? emptyCupom()); }, [open, editing]);

  const gerarCodigo = () => {
    const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 8; i++) out += s[Math.floor(Math.random() * s.length)];
    setF((p) => ({ ...p, codigo: out }));
  };

  const labelValor = f.tipo === "percentual" ? "Valor do desconto (%)" : f.tipo === "fixo" ? "Valor do desconto (R$)" : "Valor (deixe 0)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Editar cupom" : "Novo cupom"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <Field label="Código do cupom" className="sm:col-span-2">
            <div className="flex gap-2">
              <Input value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase() })} placeholder="EX: MARE10" className="font-mono" />
              <Button type="button" variant="outline" onClick={gerarCodigo}><RefreshCw className="mr-1.5 h-4 w-4" /> Gerar</Button>
            </div>
          </Field>
          <Field label="Descrição / nome interno" className="sm:col-span-2">
            <Input value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          </Field>
          <Field label="Tipo de desconto" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {(["percentual", "fixo", "frete"] as TipoDesconto[]).map((t) => (
                <button key={t} type="button" onClick={() => setF({ ...f, tipo: t })}
                  className={cn("rounded-md border px-3 py-1.5 text-sm transition", f.tipo === t ? "border-transparent text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
                  style={f.tipo === t ? { background: TEAL } : undefined}>
                  {t === "percentual" ? "Percentual" : t === "fixo" ? "Valor fixo" : "Frete grátis"}
                </button>
              ))}
            </div>
          </Field>
          <Field label={labelValor}><Input type="number" value={f.valor} onChange={(e) => setF({ ...f, valor: Number(e.target.value) })} /></Field>
          <Field label="Valor mínimo do pedido (R$)"><Input type="number" value={f.minPedido ?? ""} onChange={(e) => setF({ ...f, minPedido: e.target.value ? Number(e.target.value) : undefined })} /></Field>
          {f.tipo === "percentual" && (
            <Field label="Desconto máximo permitido (R$)"><Input type="number" value={f.descontoMax ?? ""} onChange={(e) => setF({ ...f, descontoMax: e.target.value ? Number(e.target.value) : undefined })} /></Field>
          )}
          <Field label="Limite de usos total"><Input type="number" value={f.limiteTotal} onChange={(e) => setF({ ...f, limiteTotal: Number(e.target.value) })} /></Field>
          <Field label="Limite por cliente"><Input type="number" value={f.limitePorCliente} onChange={(e) => setF({ ...f, limitePorCliente: Number(e.target.value) })} /></Field>
          <Field label="Data de início">
            <Input type="date" value={f.inicio.slice(0, 10)} onChange={(e) => setF({ ...f, inicio: new Date(e.target.value).toISOString() })} />
          </Field>
          <Field label="Data de término">
            <Input type="date" value={f.fim.slice(0, 10)} onChange={(e) => setF({ ...f, fim: new Date(e.target.value).toISOString() })} />
          </Field>
          <Field label="Aplicável a" className="sm:col-span-2">
            <Select value={f.aplicavel} onValueChange={(v) => setF({ ...f, aplicavel: v as Cupom["aplicavel"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os serviços</SelectItem>
                <SelectItem value="especificos">Serviços específicos</SelectItem>
                <SelectItem value="primeira">Primeira compra apenas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {f.aplicavel === "especificos" && (
            <Field label="Serviços" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 p-2">
                {SERVICOS.map((s) => {
                  const on = f.servicos?.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => setF({ ...f, servicos: on ? f.servicos?.filter((x) => x !== s) : [...(f.servicos ?? []), s] })}
                      className={cn("rounded-full px-3 py-1 text-xs transition", on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{s}</button>
                  );
                })}
              </div>
            </Field>
          )}
          <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 sm:col-span-2">
            <Label className="text-sm">Cupom ativo</Label>
            <Switch checked={f.ativo} onCheckedChange={(v) => setF({ ...f, ativo: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)} className="text-white hover:opacity-90" style={{ background: TEAL }}>Salvar cupom</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailDrawer({ cupom, onOpenChange, onEdit, onToggle, onDel }: { cupom: Cupom | null; onOpenChange: (o: boolean) => void; onEdit: (c: Cupom) => void; onToggle: (id: string) => void; onDel: (id: string) => void }) {
  if (!cupom) return <Sheet open={false} onOpenChange={onOpenChange}><SheetContent /></Sheet>;
  const status = computeStatus(cupom);
  const serie = Array.from({ length: 8 }, (_, i) => ({ dia: `S${i + 1}`, usos: Math.max(0, Math.round((cupom.usos / 8) * (0.6 + Math.random() * 0.8))) }));
  const recentes = [
    { nome: "Ana Silva", data: addDays(hoje, -1), valor: 25.5 },
    { nome: "Carlos Souza", data: addDays(hoje, -2), valor: 18 },
    { nome: "Marina Alves", data: addDays(hoje, -3), valor: 32 },
    { nome: "Pedro Lima", data: addDays(hoje, -5), valor: 22.4 },
  ];
  return (
    <Sheet open={!!cupom} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>Detalhes do cupom</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-5">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <CodeBadge code={cupom.codigo} />
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Usos" value={String(cupom.usos)} />
            <MiniStat label="Desconto total" value={brl(cupom.descontoTotal)} />
            <MiniStat label="Ticket médio" value={brl(cupom.ticketMedio)} />
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Uso ao longo do tempo</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dia" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="usos" stroke={TEAL} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Últimos clientes</p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {recentes.map((r, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div><p className="font-medium text-[#0A1128]">{r.nome}</p><p className="text-xs text-slate-500">{format(r.data, "dd/MM/yyyy")}</p></div>
                  <span className="font-semibold" style={{ color: TEAL }}>-{brl(r.valor)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(cupom)}><Pencil className="mr-1.5 h-4 w-4" /> Editar</Button>
            <Button variant="outline" className="flex-1" onClick={() => onToggle(cupom.id)}>
              {cupom.ativo ? <><PowerOff className="mr-1.5 h-4 w-4" /> Desativar</> : <><Power className="mr-1.5 h-4 w-4" /> Ativar</>}
            </Button>
            <Button variant="outline" className="text-rose-600 hover:text-rose-700" onClick={() => onDel(cupom.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#0A1128]">{value}</p>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><Label className="text-xs text-slate-500">{label}</Label>{children}</div>;
}
