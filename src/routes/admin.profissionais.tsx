import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, Pencil, Ban, Star, Users, UserPlus, Clock, type LucideIcon } from "lucide-react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: ProfissionaisPage,
});

type DbStatus = "ativo" | "inativo" | "pendente" | "bloqueado";
type ProfStatus = "Ativo" | "Pendente" | "Inativo" | "Bloqueado";
type Prof = {
  id: string; nome: string; telefone: string; email: string; cpf: string;
  especialidades: string[]; avaliacao: number; concluidos: number;
  status: ProfStatus; cadastro: string; regiao: string;
};

const ESPS = ["Limpeza Residencial", "Passadoria", "Hidráulica", "Elétrica", "Jardinagem", "Pintura"];
const STATUSES: ProfStatus[] = ["Ativo", "Pendente", "Inativo", "Bloqueado"];

const toUi: Record<DbStatus, ProfStatus> = { ativo: "Ativo", inativo: "Inativo", pendente: "Pendente", bloqueado: "Bloqueado" };
const toDb: Record<ProfStatus, DbStatus> = { Ativo: "ativo", Inativo: "inativo", Pendente: "pendente", Bloqueado: "bloqueado" };

const badgeStatus: Record<ProfStatus, string> = {
  Ativo: "bg-emerald-100 text-emerald-700",
  Pendente: "bg-amber-100 text-amber-700",
  Inativo: "bg-slate-100 text-slate-600",
  Bloqueado: "bg-rose-100 text-rose-700",
};

type Row = {
  id: string; nome: string; telefone: string | null; email: string | null; cpf: string | null;
  especialidades: string[]; avaliacao_media: number; atendimentos_concluidos: number;
  status: string; created_at: string; regiao: string | null;
};

const mapRow = (r: Row): Prof => ({
  id: r.id,
  nome: r.nome,
  telefone: r.telefone ?? "",
  email: r.email ?? "",
  cpf: r.cpf ?? "",
  especialidades: r.especialidades ?? [],
  avaliacao: Number(r.avaliacao_media ?? 0),
  concluidos: r.atendimentos_concluidos ?? 0,
  status: toUi[(r.status as DbStatus) ?? "pendente"] ?? "Pendente",
  cadastro: new Date(r.created_at).toLocaleDateString("pt-BR"),
  regiao: r.regiao ?? "",
});

function ProfissionaisPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "profissionais"],
    queryFn: async (): Promise<Prof[]> => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id,nome,telefone,email,cpf,especialidades,avaliacao_media,atendimentos_concluidos,status,created_at,regiao")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Row[]).map(mapRow);
    },
    enabled: !!user && isAdmin === true,
  });

  const setStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProfStatus }) => {
      const { error } = await supabase.from("profissionais").update({ status: toDb[status] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "profissionais"] }); toast.success("Status atualizado com sucesso."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: async (p: { nome: string; telefone: string; email: string; cpf: string; especialidade: string; regiao: string }) => {
      const { error } = await supabase.from("profissionais").insert({
        nome: p.nome || "Novo profissional",
        telefone: p.telefone || null,
        email: p.email || null,
        cpf: p.cpf || null,
        especialidades: p.especialidade ? [p.especialidade] : [],
        regiao: p.regiao || null,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "profissionais"] }); toast.success("Profissional cadastrado com sucesso."); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [q, setQ] = useState(""); const [esp, setEsp] = useState("all"); const [st, setSt] = useState("all"); const [minAv, setMinAv] = useState("all");
  const [open, setOpen] = useState(false); const [view, setView] = useState<Prof | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const filtered = useMemo(() => rows.filter((r) =>
    (!q || r.nome.toLowerCase().includes(q.toLowerCase())) &&
    (esp === "all" || r.especialidades.includes(esp)) &&
    (st === "all" || r.status === st) &&
    (minAv === "all" || r.avaliacao >= Number(minAv))
  ), [rows, q, esp, st, minAv]);

  const kpis = useMemo(() => {
    const now = new Date();
    const novos = rows.filter((r) => {
      const [d, m, y] = r.cadastro.split("/").map(Number);
      return y === now.getFullYear() && m === now.getMonth() + 1;
    }).length;
    return {
      ativos: rows.filter((r) => r.status === "Ativo").length,
      novos,
      media: rows.length ? rows.reduce((s, r) => s + r.avaliacao, 0) / rows.length : 0,
      pendentes: rows.filter((r) => r.status === "Pendente").length,
    };
  }, [rows]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  const setStatus = (id: string, status: ProfStatus) => setStatusMut.mutate({ id, status });

  return (
    <AdminShell active="profissionais" title="Profissionais" subtitle="Cadastre, avalie e acompanhe o desempenho da sua equipe de profissionais."
      actions={<Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 text-white hover:opacity-90" style={{ background: "#3B82F6" }}><Plus className="h-4 w-4" /> Novo profissional</Button>}>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Profissionais ativos" value={String(kpis.ativos)} icon={Users} tint="bg-emerald-100 text-emerald-600" />
        <Kpi label="Novos este mês" value={String(kpis.novos)} icon={UserPlus} tint="bg-blue-100 text-blue-600" />
        <Kpi label="Avaliação média" value={kpis.media.toFixed(1)} icon={Star} tint="bg-amber-100 text-amber-600" />
        <Kpi label="Pendentes de aprovação" value={String(kpis.pendentes)} icon={Clock} tint="bg-amber-100 text-amber-700" highlight />
      </div>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome..." className="pl-9" />
          </div>
          <Select value={esp} onValueChange={setEsp}><SelectTrigger><SelectValue placeholder="Especialidade" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas especialidades</SelectItem>{ESPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          <Select value={st} onValueChange={setSt}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos status</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={minAv} onValueChange={setMinAv}><SelectTrigger><SelectValue placeholder="Avaliação mínima" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Qualquer</SelectItem>{[3, 3.5, 4, 4.5].map((v) => <SelectItem key={v} value={String(v)}>≥ {v}</SelectItem>)}</SelectContent></Select>
          <Button variant="ghost" onClick={() => { setQ(""); setEsp("all"); setSt("all"); setMinAv("all"); }} className="text-slate-500">Limpar</Button>
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="-mx-6 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Profissional</th>
                <th className="px-3 py-3 font-semibold">Especialidades</th>
                <th className="px-3 py-3 font-semibold">Telefone</th>
                <th className="px-3 py-3 font-semibold">Avaliação</th>
                <th className="px-3 py-3 font-semibold">Concluídos</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Cadastro</th>
                <th className="px-6 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">Carregando...</td></tr>}
              {!isLoading && filtered.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full font-semibold text-white" style={{ background: TEAL }}>{r.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
                      <div className="min-w-0"><p className="font-medium text-[#0A1128]">{r.nome}</p><p className="text-xs text-slate-500">{r.email}</p></div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5"><div className="flex flex-wrap gap-1">{r.especialidades.map((e) => <span key={e} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{e}</span>)}</div></td>
                  <td className="px-3 py-3.5 text-slate-600">{r.telefone}</td>
                  <td className="px-3 py-3.5"><span className="inline-flex items-center gap-1 text-slate-700"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.avaliacao.toFixed(1)}</span></td>
                  <td className="px-3 py-3.5 text-slate-600">{r.concluidos}</td>
                  <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeStatus[r.status]}`}>{r.status}</span></td>
                  <td className="px-3 py-3.5 text-slate-600">{r.cadastro}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1 text-slate-400">
                      <button onClick={() => setView(r)} className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]" title="Ver"><Eye className="h-4 w-4" /></button>
                      <button className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]" title="Editar"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setStatus(r.id, "Bloqueado")} className="rounded p-1 hover:bg-slate-100 hover:text-rose-600" title="Bloquear"><Ban className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">Nenhum profissional encontrado com esses filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Sheet open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {view && <ProfDetail p={view} onStatus={(s) => { setStatus(view.id, s); setView({ ...view, status: s }); }} />}
        </SheetContent>
      </Sheet>

      <NovoProfDialog open={open} onOpenChange={setOpen} onSave={(p) => createMut.mutate(p)} saving={createMut.isPending} />
    </AdminShell>
  );
}

function ProfDetail({ p, onStatus }: { p: Prof; onStatus: (s: ProfStatus) => void }) {
  return (
    <>
      <SheetHeader><SheetTitle className="text-base">Perfil do profissional</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-6 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ background: TEAL }}>{p.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
          <div>
            <p className="font-semibold text-[#0A1128]">{p.nome}</p>
            <p className="text-xs text-slate-500">{p.email} · {p.telefone}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeStatus[p.status]}`}>{p.status}</span>
              <span className="inline-flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.avaliacao.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <Section title="Especialidades"><div className="flex flex-wrap gap-1">{p.especialidades.map((e) => <span key={e} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{e}</span>)}</div></Section>

        <Section title="Histórico"><p className="text-xs text-slate-500">{p.concluidos} agendamentos concluídos. Faturamento estimado: <span className="font-semibold text-[#0A1128]">{brl(p.concluidos * 180)}</span>.</p></Section>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button size="sm" onClick={() => onStatus("Ativo")} className="text-white" style={{ background: TEAL }}>Aprovar</Button>
          <Button size="sm" variant="outline" onClick={() => onStatus("Inativo")}>Inativar</Button>
          <Button size="sm" variant="outline" onClick={() => onStatus("Bloqueado")} className="text-rose-600">Bloquear</Button>
        </div>
      </div>
    </>
  );
}

function NovoProfDialog({ open, onOpenChange, onSave, saving }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (p: { nome: string; telefone: string; email: string; cpf: string; especialidade: string; regiao: string }) => void; saving: boolean }) {
  const [f, setF] = useState({ nome: "", telefone: "", email: "", cpf: "", especialidade: ESPS[0], regiao: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo profissional</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <Field label="Nome" className="sm:col-span-2"><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="CPF"><Input value={f.cpf} onChange={(e) => setF({ ...f, cpf: e.target.value })} /></Field>
          <Field label="Especialidade"><Select value={f.especialidade} onValueChange={(v) => setF({ ...f, especialidade: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ESPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Região de atuação" className="sm:col-span-2"><Input value={f.regiao} onChange={(e) => setF({ ...f, regiao: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={saving} onClick={() => onSave(f)} className="text-white" style={{ background: TEAL }}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ label, value, icon: Icon, tint, highlight }: { label: string; value: string; icon: LucideIcon; tint: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ${highlight ? "ring-amber-300" : "ring-slate-100"}`}>
      <div className="flex items-start justify-between">
        <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>{children}</section>; }
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <div className={`space-y-1.5 ${className}`}><Label className="text-xs text-slate-500">{label}</Label>{children}</div>; }
