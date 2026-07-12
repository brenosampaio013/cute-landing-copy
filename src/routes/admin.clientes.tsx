import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, Pencil, Users, UserPlus, Repeat, DollarSign, MapPin, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, brl, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: ClientesPage,
});

type ClienteStatus = "Ativo" | "Inativo";
type Cliente = {
  id: string; nome: string; email: string; telefone: string;
  agendamentos: number; gasto: number; cadastro: string; status: ClienteStatus;
};

const NOMES = ["Ana Paula Santos", "Juliana Mendes", "Carlos Alberto", "Roberto Silva", "Fernanda Costa", "Beatriz Ramos", "Paulo Henrique", "Larissa Alves", "Rodrigo Nunes", "Camila Duarte", "Bruno Lima", "Patrícia Rocha"];
const MOCK: Cliente[] = NOMES.map((n, i) => ({
  id: `c${i + 1}`, nome: n,
  email: `${n.toLowerCase().split(" ")[0]}@email.com`,
  telefone: `(21) 9${(80000000 + i * 3311).toString().slice(0, 8)}`,
  agendamentos: 1 + (i * 3) % 20,
  gasto: 150 + (i * 87) % 3000,
  cadastro: new Date(Date.now() - i * 86400000 * 20).toLocaleDateString("pt-BR"),
  status: i % 6 === 0 ? "Inativo" : "Ativo",
}));

function ClientesPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  const [rows, setRows] = useState<Cliente[]>(MOCK);
  const [q, setQ] = useState(""); const [st, setSt] = useState("all"); const [ord, setOrd] = useState("recente");
  const [open, setOpen] = useState(false); const [view, setView] = useState<Cliente | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const filtered = useMemo(() => {
    let r = rows.filter((c) =>
      (!q || c.nome.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()) || c.telefone.includes(q)) &&
      (st === "all" || c.status === st)
    );
    if (ord === "agendamentos") r = [...r].sort((a, b) => b.agendamentos - a.agendamentos);
    else if (ord === "gasto") r = [...r].sort((a, b) => b.gasto - a.gasto);
    return r;
  }, [rows, q, st, ord]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const recorrentes = rows.filter((r) => r.agendamentos > 1).length;
    const ticket = rows.reduce((s, r) => s + r.gasto, 0) / (total || 1);
    return { total, novos: 24, recorrentes: Math.round((recorrentes / total) * 100), ticket };
  }, [rows]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell active="clientes" title="Clientes" subtitle="Base de clientes, histórico de agendamentos e comportamento de compra."
      actions={<Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-white hover:opacity-90" style={{ background: "#3B82F6" }}><Plus className="h-4 w-4" /> Novo cliente</Button>}>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total de clientes" value={String(kpis.total)} icon={Users} tint="bg-blue-100 text-blue-600" />
        <Kpi label="Novos este mês" value={String(kpis.novos)} icon={UserPlus} tint="bg-emerald-100 text-emerald-600" />
        <Kpi label="Clientes recorrentes" value={`${kpis.recorrentes}%`} icon={Repeat} tint="bg-fuchsia-100 text-fuchsia-600" />
        <Kpi label="Ticket médio" value={brl(kpis.ticket)} icon={DollarSign} tint="bg-amber-100 text-amber-600" />
      </div>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone..." className="pl-9" />
          </div>
          <Select value={st} onValueChange={setSt}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent></Select>
          <Select value={ord} onValueChange={setOrd}><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="recente">Mais recente</SelectItem><SelectItem value="agendamentos">Mais agendamentos</SelectItem><SelectItem value="gasto">Maior gasto</SelectItem></SelectContent></Select>
          <Button variant="ghost" onClick={() => { setQ(""); setSt("all"); setOrd("recente"); }} className="text-slate-500">Limpar</Button>
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="-mx-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Cliente</th>
                <th className="px-3 py-3 font-semibold">E-mail</th>
                <th className="px-3 py-3 font-semibold">Telefone</th>
                <th className="px-3 py-3 font-semibold">Agend.</th>
                <th className="px-3 py-3 font-semibold">Total gasto</th>
                <th className="px-3 py-3 font-semibold">Cadastro</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">{r.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
                      <p className="font-medium text-[#0A1128]">{r.nome}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-slate-600">{r.email}</td>
                  <td className="px-3 py-3.5 text-slate-600">{r.telefone}</td>
                  <td className="px-3 py-3.5 text-slate-600">{r.agendamentos}</td>
                  <td className="px-3 py-3.5 font-semibold text-[#0A1128]">{brl(r.gasto)}</td>
                  <td className="px-3 py-3.5 text-slate-600">{r.cadastro}</td>
                  <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.status === "Ativo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{r.status}</span></td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1 text-slate-400">
                      <button onClick={() => setView(r)} className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]" title="Ver"><Eye className="h-4 w-4" /></button>
                      <button className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]" title="Editar"><Pencil className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">Nenhum cliente encontrado com esses filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Sheet open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{view && <ClienteDetail c={view} />}</SheetContent>
      </Sheet>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <F label="Nome" cn="sm:col-span-2"><Input /></F>
            <F label="E-mail"><Input type="email" /></F>
            <F label="Telefone"><Input /></F>
            <F label="Endereço" cn="sm:col-span-2"><Input /></F>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setRows((rs) => [{ id: `c${Date.now()}`, nome: "Novo cliente", email: "", telefone: "", agendamentos: 0, gasto: 0, cadastro: new Date().toLocaleDateString("pt-BR"), status: "Ativo" }, ...rs]); setOpen(false); }} className="text-white" style={{ background: TEAL }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function ClienteDetail({ c }: { c: Cliente }) {
  return (
    <>
      <SheetHeader><SheetTitle className="text-base">Perfil do cliente</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-6 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">{c.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
          <div><p className="font-semibold text-[#0A1128]">{c.nome}</p><p className="text-xs text-slate-500">{c.email} · {c.telefone}</p></div>
        </div>

        <Section title="Endereços cadastrados">
          <ul className="space-y-1.5 text-xs">
            {["Rua das Flores, 123 - Botafogo", "Av. Atlântica, 500 - Copacabana"].map((e) => (
              <li key={e} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-600"><MapPin className="h-3 w-3" /> {e}</li>
            ))}
          </ul>
        </Section>

        <Section title="Histórico de agendamentos">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-[10px] uppercase tracking-wider text-slate-400"><th className="pb-1">Data</th><th>Serviço</th><th>Status</th><th className="text-right">Valor</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: Math.min(c.agendamentos, 4) }).map((_, i) => (
                <tr key={i}><td className="py-1.5">{new Date(Date.now() - i * 86400000 * 10).toLocaleDateString("pt-BR")}</td><td>Limpeza Residencial</td><td><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Concluído</span></td><td className="text-right font-medium">{brl(180)}</td></tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Total gasto"><p className="text-xl font-bold text-[#0A1128]">{brl(c.gasto)}</p></Section>

        <Section title="Métodos de pagamento">
          <ul className="space-y-1.5 text-xs">
            <li className="rounded-md bg-slate-50 px-3 py-2 text-slate-600">Visa •••• 4242</li>
            <li className="rounded-md bg-slate-50 px-3 py-2 text-slate-600">Pix — CPF ••• 45</li>
          </ul>
        </Section>

        <Section title="Cupons utilizados"><div className="flex flex-wrap gap-1 text-xs"><span className="rounded-full bg-fuchsia-100 px-2 py-0.5 font-medium text-fuchsia-700">BEMVINDO10</span><span className="rounded-full bg-fuchsia-100 px-2 py-0.5 font-medium text-fuchsia-700">MAIO20</span></div></Section>
      </div>
    </>
  );
}

function Kpi({ label, value, icon: Icon, tint }: { label: string; value: string; icon: LucideIcon; tint: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
      <div className="flex items-start justify-between">
        <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>{children}</section>; }
function F({ label, children, cn = "" }: { label: string; children: React.ReactNode; cn?: string }) { return <div className={`space-y-1.5 ${cn}`}><Label className="text-xs text-slate-500">{label}</Label>{children}</div>; }
