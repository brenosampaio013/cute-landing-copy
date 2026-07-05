import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calendar as CalIcon,
  Clock,
  Check,
  X,
  Download,
  Plus,
  Search,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Star,
  Phone,
  MapPin,
  Trash2,
  RotateCcw,
  CheckCircle2,
  List as ListIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { useAdminAgendamentos, type AgendamentoRow } from "@/hooks/queries/use-admin-agendamentos";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, statusBadge, pagamentoBadge, brl, TEAL } from "@/components/admin/admin-shell";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/agendamentos")({
  head: () => ({
    meta: [
      { title: "Agendamentos — Painel Admin | Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgendamentosPage,
});

/* ---------- constants ---------- */
type Status = "Pendente" | "Confirmado" | "Concluído" | "Cancelado";
type Pagamento = "Pago" | "Pendente" | "Estornado";
type Ag = AgendamentoRow;

const SERVICOS = ["Limpeza Residencial", "Passadoria", "Limpeza Pós-obra", "Hidráulica", "Elétrica", "Jardinagem"];
const STATUS: Status[] = ["Pendente", "Confirmado", "Concluído", "Cancelado"];
const PAGAMENTOS: Pagamento[] = ["Pago", "Pendente", "Estornado"];

const TABS = ["Todos", "Pendentes", "Confirmados", "Concluídos", "Cancelados"] as const;

/* ---------- component ---------- */
function AgendamentosPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  const qc = useQueryClient();
  const STATUS_TO_DB: Record<Status, "pendente" | "confirmado" | "concluido" | "cancelado"> = {
    Pendente: "pendente", Confirmado: "confirmado", Concluído: "concluido", Cancelado: "cancelado",
  };
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-agendamentos"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };
  const updateStatusMut = useMutation({
    mutationFn: async ({ rawId, status }: { rawId: string; status: Status }) => {
      const { error } = await supabase
        .from("agendamentos").update({ status: STATUS_TO_DB[status] }).eq("id", rawId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => { invalidateAll(); toast.success(`Agendamento marcado como ${v.status}.`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reagendarMut = useMutation({
    mutationFn: async ({ rawId, data, hora, duracao }: { rawId: string; data: string; hora: string; duracao: number }) => {
      const [h, m] = hora.split(":").map(Number);
      const endMin = h * 60 + m + duracao;
      const horario_fim = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}:00`;
      const { error } = await supabase
        .from("agendamentos").update({ data, horario_inicio: `${hora}:00`, horario_fim }).eq("id", rawId);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Agendamento reagendado."); },
    onError: (e: Error) => toast.error(e.message),
  });


  const { data: dataRows } = useAdminAgendamentos(isAdmin === true);
  const [overrides, setOverrides] = useState<Record<string, Partial<Ag>>>({});
  const [extra, setExtra] = useState<Ag[]>([]);
  const rows = useMemo<Ag[]>(() => {
    const base = [...extra, ...(dataRows ?? [])];
    return base.map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r));
  }, [dataRows, overrides, extra]);
  const setRows = (updater: (rs: Ag[]) => Ag[]) => {
    // apply updater result and diff to build override map
    const next = updater(rows);
    const map: Record<string, Partial<Ag>> = { ...overrides };
    const extraNext: Ag[] = [];
    const baseIds = new Set((dataRows ?? []).map((r) => r.id));
    for (const r of next) {
      if (baseIds.has(r.id)) {
        map[r.id] = { status: r.status, pagamento: r.pagamento };
      } else {
        extraNext.push(r);
      }
    }
    setOverrides(map);
    setExtra(extraNext);
  };
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fServico, setFServico] = useState<string>("all");
  const [fProf, setFProf] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Todos");
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [detail, setDetail] = useState<Ag | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const profissionaisList = useMemo(
    () => Array.from(new Set(rows.map((r) => r.profissional).filter((n) => n && n !== "—"))).sort(),
    [rows],
  );



  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab !== "Todos") {
        const t = tab.replace(/s$/, "");
        if (r.status !== t) return false;
      }
      if (fStatus !== "all" && r.status !== fStatus) return false;
      if (fServico !== "all" && r.servico !== fServico) return false;
      if (fProf !== "all" && r.profissional !== fProf) return false;
      if (dateFrom && r.data < dateFrom) return false;
      if (dateTo && r.data > dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.cliente.toLowerCase().includes(q) &&
          !r.profissional.toLowerCase().includes(q) &&
          !r.servico.toLowerCase().includes(q) &&
          !r.id.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rows, tab, fStatus, fServico, fProf, dateFrom, dateTo, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => ({
    total: rows.length,
    pendente: rows.filter((r) => r.status === "Pendente").length,
    confirmado: rows.filter((r) => r.status === "Confirmado").length,
    cancelado: rows.filter((r) => r.status === "Cancelado").length,
  }), [rows]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  const toggleAll = () => {
    if (pageRows.every((r) => selected.has(r.id))) {
      const s = new Set(selected);
      pageRows.forEach((r) => s.delete(r.id));
      setSelected(s);
    } else {
      const s = new Set(selected);
      pageRows.forEach((r) => s.add(r.id));
      setSelected(s);
    }
  };
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };
  const bulkSet = (status: Status) => {
    setRows((rs) => rs.map((r) => (selected.has(r.id) ? { ...r, status } : r)));
    setSelected(new Set());
  };
  const clearFilters = () => {
    setSearch(""); setFStatus("all"); setFServico("all"); setFProf("all"); setDateFrom(""); setDateTo(""); setTab("Todos");
  };

  const headerActions = (
    <>
      <Button variant="outline" size="sm" className="gap-1.5">
        <Download className="h-4 w-4" /> Exportar
      </Button>
      <Button
        size="sm"
        onClick={() => setOpenNew(true)}
        className="gap-1.5 text-white hover:opacity-90"
        style={{ background: "#3B82F6" }}
      >
        <Plus className="h-4 w-4" /> Novo agendamento
      </Button>
    </>
  );

  return (
    <AdminShell
      active="agendamentos"
      title="Agendamentos"
      subtitle="Gerencie todos os agendamentos da plataforma"
      actions={headerActions}
    >
      {/* KPI cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de agendamentos" value={counts.total} delta="↑ 12% vs mês anterior" icon={CalIcon} tint="bg-blue-100 text-blue-600" />
        <StatCard label="Pendentes" value={counts.pendente} icon={Clock} tint="bg-amber-100 text-amber-600" />
        <StatCard label="Confirmados" value={counts.confirmado} icon={Check} tint="bg-emerald-100 text-emerald-600" />
        <StatCard label="Cancelados" value={counts.cancelado} icon={X} tint="bg-rose-100 text-rose-600" />
      </div>

      {/* Filters */}
      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_repeat(4,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por cliente, profissional ou serviço..."
              className="pl-9"
            />
          </div>
          <Select value={fStatus} onValueChange={(v) => { setFStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fServico} onValueChange={(v) => { setFServico(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Serviço" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os serviços</SelectItem>
              {SERVICOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fProf} onValueChange={(v) => { setFProf(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {profissionaisList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1" />
          </div>
          <Button variant="ghost" onClick={clearFilters} className="text-slate-500">Limpar filtros</Button>
        </div>

        {/* View toggle */}
        <div className="mt-5 flex items-center justify-between">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              onClick={() => setView("lista")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${view === "lista" ? "bg-white text-[#0A1128] shadow-sm" : "text-slate-500"}`}
            >
              <ListIcon className="h-3.5 w-3.5" /> Visão Lista
            </button>
            <button
              onClick={() => setView("calendario")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${view === "calendario" ? "bg-white text-[#0A1128] shadow-sm" : "text-slate-500"}`}
            >
              <CalIcon className="h-3.5 w-3.5" /> Visão Calendário
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Mostrando {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} de {filtered.length}
          </p>
        </div>
      </Panel>

      {/* LIST view */}
      {view === "lista" && (
        <Panel className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setPage(1); }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${tab === t ? "bg-[#0A1128] text-white" : "text-slate-500 hover:text-[#0A1128]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">{selected.size} selecionado(s)</span>
                <Button size="sm" variant="outline" onClick={() => bulkSet("Confirmado")}>Confirmar</Button>
                <Button size="sm" variant="outline" onClick={() => bulkSet("Cancelado")} className="text-rose-600">Cancelar</Button>
              </div>
            )}
          </div>

          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">
                    <Checkbox
                      checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-3 font-semibold">ID</th>
                  <th className="px-3 py-3 font-semibold">Serviço</th>
                  <th className="px-3 py-3 font-semibold">Cliente</th>
                  <th className="px-3 py-3 font-semibold">Profissional</th>
                  <th className="px-3 py-3 font-semibold">Data e hora</th>
                  <th className="px-3 py-3 font-semibold">Duração</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Pagamento</th>
                  <th className="px-3 py-3 font-semibold">Valor</th>
                  <th className="px-6 py-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-3.5">
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleOne(r.id)} />
                    </td>
                    <td className="px-3 py-3.5 font-medium text-slate-500">{r.id}</td>
                    <td className="px-3 py-3.5 font-medium text-[#0A1128]">{r.servico}</td>
                    <td className="px-3 py-3.5 text-slate-600">{r.cliente}</td>
                    <td className="px-3 py-3.5 text-slate-600">{r.profissional}</td>
                    <td className="px-3 py-3.5 text-slate-600">{fmtDateBR(r.data)} {r.hora}</td>
                    <td className="px-3 py-3.5 text-slate-600">{r.duracao} min</td>
                    <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[r.status]}`}>{r.status}</span></td>
                    <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pagamentoBadge[r.pagamento]}`}>{r.pagamento}</span></td>
                    <td className="px-3 py-3.5 font-medium text-[#0A1128]">{brl(r.valor)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1 text-slate-400">
                        <button onClick={() => setDetail(r)} className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]" title="Ver"><Eye className="h-4 w-4" /></button>
                        <button className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]" title="Editar"><Pencil className="h-4 w-4" /></button>
                        <button className="rounded p-1 hover:bg-slate-100 hover:text-rose-600" title="Cancelar"><Trash2 className="h-4 w-4" /></button>
                        <button className="rounded p-1 hover:bg-slate-100 hover:text-[#0A1128]"><MoreVertical className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr><td colSpan={11} className="px-6 py-10 text-center text-sm text-slate-500">Nenhum agendamento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-xs">
            <p className="text-slate-500">Mostrando {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} de {filtered.length}</p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-md text-xs font-medium transition ${p === page ? "bg-[#0A1128] text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {p}
                </button>
              ))}
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* CALENDAR view */}
      {view === "calendario" && (
        <Panel className="mt-6">
          <CalendarMonth
            rows={filtered}
            monthOffset={monthOffset}
            onPrev={() => setMonthOffset((m) => m - 1)}
            onNext={() => setMonthOffset((m) => m + 1)}
            onToday={() => setMonthOffset(0)}
            onSelect={setDetail}
          />
        </Panel>
      )}

      {/* NEW MODAL */}
      <NovoAgendamentoDialog
        open={openNew}
        onOpenChange={setOpenNew}
        onSave={(a) => { setRows((rs) => [a, ...rs]); setOpenNew(false); }}
        profissionais={profissionaisList}
      />

      {/* DETAIL DRAWER */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {detail && <AgendamentoDetail ag={detail} onChange={(a) => { setRows((rs) => rs.map((r) => r.id === a.id ? a : r)); setDetail(a); }} />}
        </SheetContent>
      </Sheet>
    </AdminShell>
  );
}

/* ---------- primitives ---------- */
function StatCard({
  label, value, delta, icon: Icon, tint,
}: { label: string; value: number; delta?: string; icon: React.ComponentType<{ className?: string }>; tint: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#0A1128]">{value}</p>
          {delta && <p className="mt-1 text-xs font-medium text-emerald-600">{delta}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function fmtDateBR(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

/* ---------- Calendar month grid ---------- */
function CalendarMonth({
  rows, monthOffset, onPrev, onNext, onToday, onSelect,
}: {
  rows: Ag[];
  monthOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSelect: (a: Ag) => void;
}) {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthLabel = base.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const firstWeekday = base.getDay();
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(base.getFullYear(), base.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const statusColor: Record<Status, string> = {
    Confirmado: "bg-emerald-100 text-emerald-700",
    Concluído: "bg-slate-100 text-slate-700",
    Pendente: "bg-amber-100 text-amber-700",
    Cancelado: "bg-rose-100 text-rose-700",
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize text-[#0A1128]">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-slate-200 text-xs">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-500">{d}</div>
        ))}
        {cells.map((c, i) => {
          const iso = c ? c.toISOString().slice(0, 10) : "";
          const dayRows = c ? rows.filter((r) => r.data === iso) : [];
          const today = c && c.toDateString() === now.toDateString();
          return (
            <div key={i} className="min-h-[110px] bg-white p-1.5">
              {c && (
                <>
                  <div className={`mb-1 text-[11px] font-semibold ${today ? "inline-flex h-5 w-5 items-center justify-center rounded-full text-white" : "text-slate-500"}`} style={today ? { background: TEAL } : undefined}>
                    {c.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayRows.slice(0, 3).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onSelect(r)}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium ${statusColor[r.status]}`}
                        title={`${r.hora} ${r.servico} — ${r.cliente}`}
                      >
                        {r.hora} {r.servico}
                      </button>
                    ))}
                    {dayRows.length > 3 && (
                      <p className="pl-1 text-[10px] text-slate-400">+{dayRows.length - 3} mais</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Detail drawer ---------- */
function AgendamentoDetail({ ag, onChange }: { ag: Ag; onChange: (a: Ag) => void }) {
  const timeline = [
    { label: "Criado", done: true, when: "há 3 dias" },
    { label: "Confirmado", done: ag.status !== "Pendente", when: ag.status !== "Pendente" ? "há 2 dias" : "—" },
    { label: "Em andamento", done: ag.status === "Concluído", when: ag.status === "Concluído" ? "há 1 dia" : "—" },
    { label: "Concluído", done: ag.status === "Concluído", when: ag.status === "Concluído" ? "hoje" : "—" },
  ];
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <SheetTitle className="text-base">{ag.id}</SheetTitle>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[ag.status]}`}>{ag.status}</span>
        </div>
      </SheetHeader>

      <div className="mt-6 space-y-6 text-sm">
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cliente</p>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">
              {ag.cliente.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#0A1128]">{ag.cliente}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3 w-3" /> {ag.clienteTel}</p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3 w-3" /> {ag.clienteEndereco}</p>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Profissional</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white" style={{ background: TEAL }}>
              {ag.profissional.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="font-semibold text-[#0A1128]">{ag.profissional}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {ag.profRating.toFixed(1)}
              </p>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Serviço</p>
          <dl className="grid grid-cols-2 gap-y-2 text-xs">
            <dt className="text-slate-500">Serviço</dt><dd className="text-right font-medium text-[#0A1128]">{ag.servico}</dd>
            <dt className="text-slate-500">Data</dt><dd className="text-right font-medium text-[#0A1128]">{fmtDateBR(ag.data)} {ag.hora}</dd>
            <dt className="text-slate-500">Duração</dt><dd className="text-right font-medium text-[#0A1128]">{ag.duracao} min</dd>
            <dt className="text-slate-500">Valor</dt><dd className="text-right font-semibold" style={{ color: TEAL }}>{brl(ag.valor)}</dd>
            <dt className="text-slate-500">Pagamento</dt><dd className="text-right"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${pagamentoBadge[ag.pagamento]}`}>{ag.pagamento}</span></dd>
          </dl>
          {ag.observacoes && <p className="mt-3 rounded-md bg-amber-50 p-2.5 text-xs text-amber-800">{ag.observacoes}</p>}
        </section>

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Histórico</p>
          <ol className="space-y-3">
            {timeline.map((t) => (
              <li key={t.label} className="flex items-center gap-3 text-xs">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${t.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <span className={t.done ? "font-medium text-[#0A1128]" : "text-slate-400"}>{t.label}</span>
                <span className="ml-auto text-slate-400">{t.when}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onChange({ ...ag, status: "Confirmado" })}>
            <Check className="h-4 w-4" /> Confirmar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Reagendar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-emerald-600" onClick={() => onChange({ ...ag, status: "Concluído" })}>
            <CheckCircle2 className="h-4 w-4" /> Concluir
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-rose-600" onClick={() => onChange({ ...ag, status: "Cancelado" })}>
            <X className="h-4 w-4" /> Cancelar
          </Button>
        </div>
      </div>
    </>
  );
}

/* ---------- New agendamento dialog ---------- */
function NovoAgendamentoDialog({
  open, onOpenChange, onSave, profissionais,
}: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (a: Ag) => void; profissionais: string[] }) {
  const [form, setForm] = useState({
    cliente: "", servico: "", profissional: "", data: "", hora: "", duracao: "60",
    endereco: "", valor: "", pagamento: "Pendente" as Pagamento, observacoes: "", cupom: "",
  });
  const submit = () => {
    onSave({
      id: `#${Math.floor(Math.random() * 9000 + 1000)}`,
      rawId: crypto.randomUUID(),
      servico: form.servico || "Limpeza Residencial",
      cliente: form.cliente || "Novo cliente",
      clienteTel: "(21) 90000-0000",
      clienteEndereco: form.endereco || "—",
      profissional: form.profissional || profissionais[0] || "—",
      profRating: 4.8,
      data: form.data || new Date().toISOString().slice(0, 10),
      hora: form.hora || "10:00",
      duracao: Number(form.duracao) || 60,
      status: "Pendente",
      pagamento: form.pagamento,
      valor: Number(form.valor) || 150,
      observacoes: form.observacoes || undefined,
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Cliente"><Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Buscar cliente..." /></Field>
          <Field label="Serviço">
            <Select value={form.servico} onValueChange={(v) => setForm({ ...form, servico: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{SERVICOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Profissional">
            <Select value={form.profissional} onValueChange={(v) => setForm({ ...form, profissional: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>{profissionais.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Duração (min)"><Input type="number" value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} /></Field>
          <Field label="Data"><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></Field>
          <Field label="Horário"><Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Field>
          <Field label="Endereço" className="sm:col-span-2"><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></Field>
          <Field label="Valor (R$)"><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></Field>
          <Field label="Cupom"><Input value={form.cupom} onChange={(e) => setForm({ ...form, cupom: e.target.value })} placeholder="Opcional" /></Field>
          <Field label="Forma de pagamento" className="sm:col-span-2">
            <Select value={form.pagamento} onValueChange={(v) => setForm({ ...form, pagamento: v as Pagamento })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAGAMENTOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Observações" className="sm:col-span-2"><Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} className="text-white hover:opacity-90" style={{ background: TEAL }}>Salvar agendamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-slate-500">{label}</Label>
      {children}
    </div>
  );
}
