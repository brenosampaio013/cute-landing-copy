import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download, Search, Eye, DollarSign, AlertCircle, CreditCard, Banknote, QrCode,
  CheckCircle2, Clock, Trash2, Loader2, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, brl, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: PagamentosPage,
});

type StatusDb = "pago" | "pendente" | "estornado";
type StatusUi = "Pago" | "Pendente" | "Estornado";
type Metodo = "Pix" | "Cartão de crédito";

type Tx = {
  id: string;
  agendamentoId: string;
  agIdShort: string;
  servico: string;
  cliente: string;
  valor: number;
  metodo: string | null;
  status: StatusUi;
  dataPagamento: string | null;
  createdAt: string;
};

const METS: Metodo[] = ["Pix", "Cartão de crédito"];
const TABS = ["Todos", "Pagos", "Pendentes", "Estornados"] as const;
const STATUS_TO_UI: Record<StatusDb, StatusUi> = { pago: "Pago", pendente: "Pendente", estornado: "Estornado" };
const STATUS_TO_DB: Record<StatusUi, StatusDb> = { Pago: "pago", Pendente: "pendente", Estornado: "estornado" };
const badge: Record<StatusUi, string> = { Pago: "bg-emerald-100 text-emerald-700", Pendente: "bg-amber-100 text-amber-700", Estornado: "bg-rose-100 text-rose-700" };
const metodoIconFor = (m: string | null): LucideIcon => {
  const key = (m ?? "").toLowerCase();
  if (key.includes("pix")) return QrCode;
  if (key.includes("cart")) return CreditCard;
  if (key.includes("boleto") || key.includes("dinheiro") || key.includes("transfer")) return Banknote;
  return DollarSign;
};

async function fetchPagamentos(): Promise<Tx[]> {
  const { data: pags, error } = await supabase
    .from("pagamentos")
    .select("id, agendamento_id, valor, status, metodo, data_pagamento, created_at, agendamentos!inner(id, servico, cliente_id)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (pags ?? []) as unknown as Array<{
    id: string; agendamento_id: string; valor: number; status: StatusDb;
    metodo: string | null; data_pagamento: string | null; created_at: string;
    agendamentos: { id: string; servico: string; cliente_id: string };
  }>;

  const clienteIds = Array.from(new Set(rows.map((r) => r.agendamentos.cliente_id)));
  const nameById = new Map<string, string>();
  if (clienteIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("id, nome").in("id", clienteIds);
    (profs ?? []).forEach((p) => nameById.set(p.id, p.nome ?? "—"));
  }

  return rows.map((r) => ({
    id: r.id,
    agendamentoId: r.agendamento_id,
    agIdShort: `#${r.agendamento_id.slice(0, 6).toUpperCase()}`,
    servico: r.agendamentos.servico,
    cliente: nameById.get(r.agendamentos.cliente_id) ?? "—",
    valor: Number(r.valor),
    metodo: r.metodo,
    status: STATUS_TO_UI[r.status] ?? "Pendente",
    dataPagamento: r.data_pagamento,
    createdAt: r.created_at,
  }));
}

function PagamentosPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  const [tab, setTab] = useState<(typeof TABS)[number]>("Todos");
  const [q, setQ] = useState("");
  const [met, setMet] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<Tx | null>(null);
  const [markPaid, setMarkPaid] = useState<Tx | null>(null);
  const [markMetodo, setMarkMetodo] = useState<Metodo>("Pix");
  const [markValor, setMarkValor] = useState<string>("");


  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-pagamentos"],
    queryFn: fetchPagamentos,
    enabled: isAdmin === true,
    staleTime: 30_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pagamentos"] });
    qc.invalidateQueries({ queryKey: ["admin-agendamentos"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  useEffect(() => {
    if (isAdmin !== true) return;
    const channel = supabase
      .channel("admin-pagamentos-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "pagamentos" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-pagamentos"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-pagamentos"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, qc]);

  const updateMut = useMutation({
    mutationFn: async (input: { id: string; status: StatusUi; metodo?: string | null; valor?: number }) => {
      const patch: {
        status: StatusDb;
        data_pagamento?: string | null;
        metodo?: string | null;
        valor?: number;
      } = { status: STATUS_TO_DB[input.status] };
      if (input.status === "Pago") {
        patch.data_pagamento = new Date().toISOString();
        if (input.metodo !== undefined) patch.metodo = input.metodo;
      } else if (input.status === "Pendente") {
        patch.data_pagamento = null;
      }
      if (input.valor !== undefined) patch.valor = input.valor;
      const { error } = await supabase.from("pagamentos").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => { invalidate(); toast.success(`Pagamento marcado como ${v.status}.`); },
    onError: (e: Error) => toast.error(e.message),
  });


  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pagamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Pagamento excluído."); },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const filtered = useMemo(() => (rows ?? []).filter((r) => {
    if (tab === "Pagos" && r.status !== "Pago") return false;
    if (tab === "Pendentes" && r.status !== "Pendente") return false;
    if (tab === "Estornados" && r.status !== "Estornado") return false;
    if (met !== "all" && (r.metodo ?? "") !== met) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!r.agIdShort.toLowerCase().includes(s) && !r.cliente.toLowerCase().includes(s) && !r.servico.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [rows, tab, q, met]);

  const kpis = useMemo(() => {
    const all = rows ?? [];
    const pagos = all.filter((r) => r.status === "Pago");
    return {
      bruto: pagos.reduce((s, r) => s + r.valor, 0),
      pendentes: all.filter((r) => r.status === "Pendente").length,
      estornados: all.filter((r) => r.status === "Estornado").length,
      total: all.length,
    };
  }, [rows]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell active="pagamentos" title="Pagamentos" subtitle="Acompanhe e confirme os pagamentos dos clientes"
      actions={<Button size="sm" variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> Exportar</Button>}>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Faturamento (pagos)" value={brl(kpis.bruto)} icon={DollarSign} tint="bg-emerald-100 text-emerald-600" />
        <Kpi label="Pendentes" value={String(kpis.pendentes)} icon={Clock} tint="bg-amber-100 text-amber-600" />
        <Kpi label="Estornados" value={String(kpis.estornados)} icon={AlertCircle} tint="bg-rose-100 text-rose-600" />
        <Kpi label="Total de transações" value={String(kpis.total)} icon={CheckCircle2} tint="bg-blue-100 text-blue-600" />
      </div>

      <Panel className="mt-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente, serviço ou ID..." className="pl-9" />
          </div>
          <Select value={met} onValueChange={setMet}>
            <SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos métodos</SelectItem>
              {METS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => { setQ(""); setMet("all"); }} className="text-slate-500">Limpar</Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${tab === t ? "bg-[#0A1128] text-white" : "text-slate-500 hover:text-[#0A1128]"}`}>{t}</button>
          ))}
        </div>
      </Panel>

      <Panel className="mt-6">
        <div className="-mx-6 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Agendamento</th>
                <th className="px-3 py-3 font-semibold">Cliente</th>
                <th className="px-3 py-3 font-semibold">Serviço</th>
                <th className="px-3 py-3 font-semibold">Método</th>
                <th className="px-3 py-3 font-semibold text-right">Valor</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Data</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-400"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">Nenhuma transação encontrada.</td></tr>
              ) : filtered.map((r) => {
                const Icon = metodoIconFor(r.metodo);
                return (
                  <tr key={r.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-medium text-[#0A1128]">{r.agIdShort}</td>
                    <td className="px-3 py-3.5 text-slate-600">{r.cliente}</td>
                    <td className="px-3 py-3.5 text-slate-600">{r.servico}</td>
                    <td className="px-3 py-3.5"><span className="inline-flex items-center gap-1.5 text-slate-600"><Icon className="h-3.5 w-3.5" /> {r.metodo ?? "—"}</span></td>
                    <td className={`px-3 py-3.5 text-right ${r.status === "Pago" ? "font-bold text-emerald-600" : "font-medium text-[#0A1128]"}`}>
                      <span className="inline-flex items-center justify-end gap-1.5">
                        {r.status === "Pago" && <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Pago" />}
                        {brl(r.valor)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge[r.status]}`}>{r.status}</span></td>
                    <td className="px-3 py-3.5 text-slate-600">
                      {r.dataPagamento ? new Date(r.dataPagamento).toLocaleDateString("pt-BR") : new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== "Pago" && (
                          <Button
                            size="sm"
                            className="h-8 gap-1 text-white hover:opacity-90"
                            style={{ background: TEAL }}
                            onClick={() => { setMarkMetodo((r.metodo as Metodo) || "Pix"); setMarkValor(r.valor > 0 ? String(r.valor) : ""); setMarkPaid(r); }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pago
                          </Button>
                        )}
                        {r.status === "Pago" && (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => updateMut.mutate({ id: r.id, status: "Pendente" })}>
                            Reverter
                          </Button>
                        )}
                        {r.status !== "Estornado" && r.status === "Pago" && (
                          <Button size="sm" variant="outline" className="h-8 text-rose-600" onClick={() => updateMut.mutate({ id: r.id, status: "Estornado" })}>
                            Estornar
                          </Button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(r)}
                          className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir pagamento?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            Tem certeza que deseja excluir o pagamento de <strong>{confirmDelete?.cliente}</strong> ({brl(confirmDelete?.valor ?? 0)})?
            Esta ação é permanente e não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (!confirmDelete) return;
                deleteMut.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) });
              }}
            >
              {deleteMut.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as paid */}
      <Dialog open={!!markPaid} onOpenChange={(o) => !o && setMarkPaid(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar pagamento</DialogTitle></DialogHeader>
          {markPaid && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="font-medium text-[#0A1128]">{markPaid.cliente} · {markPaid.servico}</p>
                <p className="mt-1 text-xs text-slate-500">Valor atual: <span className="font-semibold text-[#0A1128]">{brl(markPaid.valor)}</span></p>
              </div>
              <div>
                <Label className="text-xs">Valor do serviço (R$) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="mt-1"
                  placeholder="0,00"
                  value={markValor}
                  onChange={(e) => setMarkValor(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Método de pagamento</Label>
                <Select value={markMetodo} onValueChange={(v) => setMarkMetodo(v as Metodo)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-500">
                Ao confirmar, o pagamento aparecerá como <strong>Pago</strong> na conta do cliente.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaid(null)}>Cancelar</Button>
            <Button
              className="gap-1.5 text-white hover:opacity-90"
              style={{ background: TEAL }}
              disabled={updateMut.isPending}
              onClick={() => {
                if (!markPaid) return;
                const valorNum = Number(String(markValor).replace(",", "."));
                if (!markValor.trim() || Number.isNaN(valorNum) || valorNum <= 0) {
                  toast.error("Informe um valor válido, maior que zero.");
                  return;
                }
                if (valorNum > 1_000_000) {
                  toast.error("Valor acima do limite permitido.");
                  return;
                }
                updateMut.mutate(
                  { id: markPaid.id, status: "Pago", metodo: markMetodo, valor: valorNum },
                  { onSuccess: () => setMarkPaid(null) },
                );
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {updateMut.isPending ? "Salvando..." : "Confirmar pagamento"}
            </Button>
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
