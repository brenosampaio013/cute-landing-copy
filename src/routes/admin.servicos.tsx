import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, MoreVertical, Copy, Pencil, Trash2, Brush, Shirt, Hammer, Droplets, Leaf, Zap, TrendingUp, LayoutGrid, DollarSign, Tag as TagIcon, type LucideIcon } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: ServicosPage,
});

type Servico = {
  id: string; nome: string; categoria: string; descricao: string;
  preco: number; duracao: number; ativo: boolean; agendamentosMes: number;
  icon: LucideIcon; tint: string;
};

const CATS = ["Limpeza", "Reformas", "Manutenção", "Jardim"];
const MOCK: Servico[] = [
  { id: "s1", nome: "Limpeza Residencial", categoria: "Limpeza", descricao: "Limpeza padrão completa.", preco: 180, duracao: 180, ativo: true, agendamentosMes: 42, icon: Brush, tint: "bg-emerald-100 text-emerald-600" },
  { id: "s2", nome: "Passadoria", categoria: "Limpeza", descricao: "Serviço de passadoria de roupas.", preco: 90, duracao: 120, ativo: true, agendamentosMes: 18, icon: Shirt, tint: "bg-sky-100 text-sky-600" },
  { id: "s3", nome: "Limpeza Pós-obra", categoria: "Limpeza", descricao: "Limpeza pesada após reformas.", preco: 350, duracao: 300, ativo: true, agendamentosMes: 9, icon: Brush, tint: "bg-amber-100 text-amber-600" },
  { id: "s4", nome: "Hidráulica", categoria: "Manutenção", descricao: "Reparos hidráulicos gerais.", preco: 220, duracao: 90, ativo: true, agendamentosMes: 14, icon: Droplets, tint: "bg-blue-100 text-blue-600" },
  { id: "s5", nome: "Jardinagem", categoria: "Jardim", descricao: "Poda, capina e paisagismo básico.", preco: 160, duracao: 150, ativo: false, agendamentosMes: 5, icon: Leaf, tint: "bg-lime-100 text-lime-600" },
  { id: "s6", nome: "Elétrica", categoria: "Manutenção", descricao: "Instalações e reparos elétricos.", preco: 240, duracao: 90, ativo: true, agendamentosMes: 12, icon: Zap, tint: "bg-orange-100 text-orange-600" },
  { id: "s7", nome: "Pintura", categoria: "Reformas", descricao: "Pintura de paredes internas.", preco: 400, duracao: 480, ativo: true, agendamentosMes: 7, icon: Hammer, tint: "bg-fuchsia-100 text-fuchsia-600" },
];

function ServicosPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const [rows, setRows] = useState<Servico[]>(MOCK);
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all"); const [st, setSt] = useState("all");
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Servico | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const filtered = useMemo(() => rows.filter((r) =>
    (cat === "all" || r.categoria === cat) &&
    (st === "all" || (st === "ativo" ? r.ativo : !r.ativo)) &&
    (!q || r.nome.toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, cat, st]);

  const kpis = useMemo(() => {
    const ativos = rows.filter((r) => r.ativo).length;
    const mais = [...rows].sort((a, b) => b.agendamentosMes - a.agendamentosMes)[0];
    const ticket = rows.reduce((s, r) => s + r.preco, 0) / (rows.length || 1);
    const cats = new Set(rows.map((r) => r.categoria)).size;
    return { ativos, mais, ticket, cats };
  }, [rows]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  const save = (s: Servico) => {
    setRows((rs) => (rs.some((r) => r.id === s.id) ? rs.map((r) => r.id === s.id ? s : r) : [s, ...rs]));
    setOpen(false); setEditing(null);
  };
  const toggle = (id: string) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, ativo: !r.ativo } : r));
  const dup = (s: Servico) => setRows((rs) => [{ ...s, id: `s${Date.now()}`, nome: `${s.nome} (cópia)`, agendamentosMes: 0 }, ...rs]);
  const del = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  return (
    <AdminShell active="servicos" title="Serviços" subtitle="Gerencie o catálogo de serviços oferecidos"
      actions={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5 text-white hover:opacity-90" style={{ background: "#3B82F6" }}><Plus className="h-4 w-4" /> Novo serviço</Button>}>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Serviços ativos" value={String(kpis.ativos)} icon={LayoutGrid} tint="bg-blue-100 text-blue-600" />
        <Kpi label="Mais contratado" value={kpis.mais?.nome ?? "—"} sub={kpis.mais ? `${kpis.mais.agendamentosMes} agend.` : ""} icon={TrendingUp} tint="bg-emerald-100 text-emerald-600" />
        <Kpi label="Ticket médio" value={brl(kpis.ticket)} icon={DollarSign} tint="bg-amber-100 text-amber-600" />
        <Kpi label="Categorias" value={String(kpis.cats)} icon={TagIcon} tint="bg-fuchsia-100 text-fuchsia-600" />
      </div>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar serviço..." className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}><SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas categorias</SelectItem>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={st} onValueChange={setSt}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select>
          <Button variant="ghost" onClick={() => { setQ(""); setCat("all"); setSt("all"); }} className="text-slate-500">Limpar</Button>
        </div>
      </Panel>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((s) => (
          <div key={s.id} className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`flex h-28 items-center justify-center ${s.tint}`}><s.icon className="h-10 w-10" /></div>
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-[#0A1128]">{s.nome}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><button className="rounded p-1 text-slate-400 hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => dup(s)}><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => del(s.id)} className="text-rose-600"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <span className="mb-2 inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{s.categoria}</span>
              <dl className="mt-1 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between"><dt>Preço base</dt><dd className="font-semibold" style={{ color: TEAL }}>{brl(s.preco)}</dd></div>
                <div className="flex justify-between"><dt>Duração</dt><dd className="font-medium text-[#0A1128]">{s.duracao} min</dd></div>
                <div className="flex justify-between"><dt>Agend. no mês</dt><dd className="font-medium text-[#0A1128]">{s.agendamentosMes}</dd></div>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className={s.ativo ? "font-medium text-emerald-600" : "font-medium text-slate-400"}>{s.ativo ? "Ativo" : "Inativo"}</span>
                <Switch checked={s.ativo} onCheckedChange={() => toggle(s.id)} />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-500">Nenhum serviço encontrado.</p>}
      </div>

      <ServicoDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }} editing={editing} onSave={save} />
    </AdminShell>
  );
}

function Kpi({ label, value, sub, icon: Icon, tint }: { label: string; value: string; sub?: string; icon: LucideIcon; tint: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-xl font-bold text-[#0A1128]">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

function ServicoDialog({ open, onOpenChange, editing, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; editing: Servico | null; onSave: (s: Servico) => void }) {
  const [f, setF] = useState<Servico>(editing ?? { id: `s${Date.now()}`, nome: "", categoria: CATS[0], descricao: "", preco: 0, duracao: 60, ativo: true, agendamentosMes: 0, icon: Brush, tint: "bg-emerald-100 text-emerald-600" });
  useEffect(() => { if (open) setF(editing ?? { id: `s${Date.now()}`, nome: "", categoria: CATS[0], descricao: "", preco: 0, duracao: 60, ativo: true, agendamentosMes: 0, icon: Brush, tint: "bg-emerald-100 text-emerald-600" }); }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <Field label="Nome" className="sm:col-span-2"><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="Categoria">
            <Select value={f.categoria} onValueChange={(v) => setF({ ...f, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Preço base (R$)"><Input type="number" value={f.preco} onChange={(e) => setF({ ...f, preco: Number(e.target.value) })} /></Field>
          <Field label="Duração (min)"><Input type="number" value={f.duracao} onChange={(e) => setF({ ...f, duracao: Number(e.target.value) })} /></Field>
          <Field label="Imagem/ícone"><Input type="file" accept="image/*" /></Field>
          <Field label="Descrição" className="sm:col-span-2"><Textarea rows={3} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></Field>
          <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 sm:col-span-2">
            <Label className="text-sm">Serviço ativo</Label>
            <Switch checked={f.ativo} onCheckedChange={(v) => setF({ ...f, ativo: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(f)} className="text-white hover:opacity-90" style={{ background: TEAL }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label className="text-xs text-slate-500">{label}</Label>{children}</div>;
}
