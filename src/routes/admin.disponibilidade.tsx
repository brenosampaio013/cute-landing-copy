import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CalendarDays, Ban, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DEFAULT_CONFIG,
  DIAS_SEMANA,
  computeMonthStatus,
  type DispConfig,
  type DispExcecao,
  type DispSemanal,
} from "@/lib/disponibilidade";

export const Route = createFileRoute("/admin/disponibilidade")({
  head: () => ({
    meta: [
      { title: "Disponibilidade — Painel Admin | Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell
      active="horarios"
      title="Disponibilidade"
      subtitle="Regras gerais de atendimento: grade padrão, exceções por data, antecedência e capacidade."
    >
      <Tabs defaultValue="padrao">
        <TabsList>
          <TabsTrigger value="padrao" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Horário padrão</TabsTrigger>
          <TabsTrigger value="excecoes" className="gap-1.5"><Ban className="h-4 w-4" /> Exceções</TabsTrigger>
          <TabsTrigger value="regras" className="gap-1.5"><Settings2 className="h-4 w-4" /> Regras</TabsTrigger>
          <TabsTrigger value="calendario" className="gap-1.5"><CalendarDays className="h-4 w-4" /> Calendário</TabsTrigger>
        </TabsList>
        <TabsContent value="padrao" className="mt-4"><HorarioPadrao /></TabsContent>
        <TabsContent value="excecoes" className="mt-4"><Excecoes /></TabsContent>
        <TabsContent value="regras" className="mt-4"><Regras /></TabsContent>
        <TabsContent value="calendario" className="mt-4"><CalendarioAdmin /></TabsContent>
      </Tabs>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Data hooks

function useConfig() {
  return useQuery({
    queryKey: ["disponibilidade", "config"],
    queryFn: async (): Promise<DispConfig> => {
      const { data, error } = await supabase
        .from("disponibilidade_config" as never)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return (data as DispConfig | null) ?? DEFAULT_CONFIG;
    },
    staleTime: 60_000,
  });
}

function useSemanal() {
  return useQuery({
    queryKey: ["disponibilidade", "semanal"],
    queryFn: async (): Promise<DispSemanal[]> => {
      const { data, error } = await supabase
        .from("disponibilidade_semanal" as never)
        .select("id,dia_semana,hora_inicio,hora_fim,ativo")
        .order("dia_semana")
        .order("hora_inicio");
      if (error) throw error;
      return (data ?? []) as DispSemanal[];
    },
    staleTime: 60_000,
  });
}

function useExcecoes() {
  return useQuery({
    queryKey: ["disponibilidade", "excecoes"],
    queryFn: async (): Promise<DispExcecao[]> => {
      const { data, error } = await supabase
        .from("disponibilidade_excecoes" as never)
        .select("id,data,tipo,hora_inicio,hora_fim,motivo")
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DispExcecao[];
    },
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────────────────────
// Horário padrão

function HorarioPadrao() {
  const qc = useQueryClient();
  const { data: semanal = [], isLoading } = useSemanal();

  const addMut = useMutation({
    mutationFn: async (v: { dia_semana: number; hora_inicio: string; hora_fim: string }) => {
      const { error } = await supabase.from("disponibilidade_semanal" as never).insert({ ...v, ativo: true });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["disponibilidade", "semanal"] }); toast.success("Janela adicionada."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("disponibilidade_semanal" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["disponibilidade", "semanal"] }); toast.success("Janela removida."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("disponibilidade_semanal" as never).update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disponibilidade", "semanal"] }),
  });

  const grouped = useMemo(() => {
    const g: Record<number, DispSemanal[]> = {};
    for (let i = 0; i < 7; i++) g[i] = [];
    semanal.forEach((h) => g[h.dia_semana].push(h));
    return g;
  }, [semanal]);

  return (
    <Panel>
      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Defina as janelas de atendimento recorrentes por dia da semana. Um dia sem janelas ficará fechado.
          </p>
          {DIAS_SEMANA.map((nome, dia) => {
            const items = grouped[dia];
            const atendeAlgum = items.some((h) => h.ativo);
            return (
              <div key={dia} className="rounded-lg border border-slate-100 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#0A1128]">{nome}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${atendeAlgum ? "text-emerald-600" : "text-slate-400"}`}>
                      {atendeAlgum ? "Atende" : "Fechado"}
                    </span>
                  </div>
                  <AddSlot onAdd={(hi, hf) => addMut.mutate({ dia_semana: dia, hora_inicio: hi, hora_fim: hf })} />
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400">Sem janelas — dia fechado.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {items.map((h) => (
                      <div
                        key={h.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                          h.ativo
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-50 text-slate-500 line-through"
                        }`}
                      >
                        <span className="font-medium">{h.hora_inicio.slice(0, 5)} – {h.hora_fim.slice(0, 5)}</span>
                        <button
                          onClick={() => toggleMut.mutate({ id: h.id, ativo: !h.ativo })}
                          className="text-[10px] uppercase tracking-wide opacity-70 hover:opacity-100"
                        >
                          {h.ativo ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => delMut.mutate(h.id)}
                          className="opacity-60 hover:text-rose-600 hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function AddSlot({ onAdd }: { onAdd: (hi: string, hf: string) => void }) {
  const [hi, setHi] = useState("08:00");
  const [hf, setHf] = useState("18:00");
  return (
    <div className="flex items-center gap-2">
      <Input type="time" value={hi} onChange={(e) => setHi(e.target.value)} className="h-8 w-28" />
      <span className="text-xs text-slate-400">até</span>
      <Input type="time" value={hf} onChange={(e) => setHf(e.target.value)} className="h-8 w-28" />
      <Button
        size="sm"
        onClick={() => {
          if (hf <= hi) { toast.error("O horário final precisa ser maior que o inicial."); return; }
          onAdd(hi + ":00", hf + ":00");
        }}
        className="h-8 gap-1 text-white"
        style={{ background: TEAL }}
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Exceções

function Excecoes() {
  const qc = useQueryClient();
  const { data: excecoes = [], isLoading } = useExcecoes();

  const [data, setData] = useState("");
  const [tipo, setTipo] = useState<"bloqueio_dia" | "bloqueio_horario" | "horario_extra">("bloqueio_dia");
  const [hi, setHi] = useState("");
  const [hf, setHf] = useState("");
  const [motivo, setMotivo] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Selecione uma data");
      const payload: {
        data: string;
        tipo: typeof tipo;
        hora_inicio: string | null;
        hora_fim: string | null;
        motivo: string | null;
      } = { data, tipo, hora_inicio: null, hora_fim: null, motivo: motivo || null };
      if (tipo !== "bloqueio_dia") {
        if (!hi || !hf) throw new Error("Preencha início e fim");
        if (hf <= hi) throw new Error("Fim deve ser posterior ao início");
        payload.hora_inicio = hi + ":00";
        payload.hora_fim = hf + ":00";
      }
      const { error } = await supabase.from("disponibilidade_excecoes" as never).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disponibilidade", "excecoes"] });
      setData(""); setHi(""); setHf(""); setMotivo(""); setTipo("bloqueio_dia");
      toast.success("Exceção criada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("disponibilidade_excecoes" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["disponibilidade", "excecoes"] }); toast.success("Exceção removida."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const tipoLabel: Record<string, string> = {
    bloqueio_dia: "Dia inteiro fechado",
    bloqueio_horario: "Horário bloqueado",
    horario_extra: "Horário extra",
  };
  const tipoBadge: Record<string, string> = {
    bloqueio_dia: "bg-rose-100 text-rose-700",
    bloqueio_horario: "bg-amber-100 text-amber-700",
    horario_extra: "bg-emerald-100 text-emerald-700",
  };

  return (
    <Panel>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1.4fr_auto]">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Data</Label>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bloqueio_dia">Dia inteiro</SelectItem>
              <SelectItem value="bloqueio_horario">Bloqueio de horário</SelectItem>
              <SelectItem value="horario_extra">Horário extra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Início</Label>
          <Input type="time" value={hi} onChange={(e) => setHi(e.target.value)} disabled={tipo === "bloqueio_dia"} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Fim</Label>
          <Input type="time" value={hf} onChange={(e) => setHf(e.target.value)} disabled={tipo === "bloqueio_dia"} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Motivo (opcional)</Label>
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Feriado, evento, folga..." />
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => addMut.mutate()}
            disabled={addMut.isPending}
            className="gap-1 text-white"
            style={{ background: TEAL }}
          >
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : excecoes.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma exceção cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-semibold">Data</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Horário</th>
                <th className="px-3 py-2 font-semibold">Motivo</th>
                <th className="px-3 py-2 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {excecoes.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-slate-700">{new Date(e.data + "T00:00").toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tipoBadge[e.tipo]}`}>
                      {tipoLabel[e.tipo]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 tabular-nums">
                    {e.tipo === "bloqueio_dia" ? "—" : `${e.hora_inicio?.slice(0, 5)} – ${e.hora_fim?.slice(0, 5)}`}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{e.motivo || "—"}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => delMut.mutate(e.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────
// Regras

function Regras() {
  const qc = useQueryClient();
  const { data: config } = useConfig();
  const [form, setForm] = useState<DispConfig | null>(null);

  useEffect(() => { if (config) setForm(config); }, [config]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await supabase
        .from("disponibilidade_config" as never)
        .update({
          slot_duracao_min: form.slot_duracao_min,
          capacidade_por_slot: form.capacidade_por_slot,
          antecedencia_minima_min: form.antecedencia_minima_min,
          janela_futura_dias: form.janela_futura_dias,
          poucos_horarios_threshold: form.poucos_horarios_threshold,
        })
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["disponibilidade", "config"] }); toast.success("Regras atualizadas."); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <Panel><p className="text-sm text-slate-500">Carregando...</p></Panel>;

  const upd = <K extends keyof DispConfig>(k: K, v: DispConfig[K]) => setForm({ ...form, [k]: v });

  return (
    <Panel>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Duração de cada slot (minutos)</Label>
          <Select value={String(form.slot_duracao_min)} onValueChange={(v) => upd("slot_duracao_min", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="90">1h30</SelectItem>
              <SelectItem value="120">2 horas</SelectItem>
              <SelectItem value="180">3 horas</SelectItem>
              <SelectItem value="240">4 horas</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">Granularidade da grade exibida no calendário público.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Capacidade por horário (atendimentos simultâneos)</Label>
          <Input
            type="number"
            min={1}
            value={form.capacidade_por_slot}
            onChange={(e) => upd("capacidade_por_slot", Math.max(1, Number(e.target.value) || 1))}
          />
          <p className="text-[11px] text-slate-400">Quantos agendamentos podem coexistir no mesmo horário (útil quando há vários profissionais).</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Antecedência mínima</Label>
          <Select
            value={String(form.antecedencia_minima_min)}
            onValueChange={(v) => upd("antecedencia_minima_min", Number(v))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="120">2 horas</SelectItem>
              <SelectItem value="240">4 horas</SelectItem>
              <SelectItem value="720">12 horas</SelectItem>
              <SelectItem value="1440">24 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Janela futura (dias)</Label>
          <Select
            value={String(form.janela_futura_dias)}
            onValueChange={(v) => upd("janela_futura_dias", Number(v))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400">Quão longe o cliente pode agendar.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Limite de "poucos horários"</Label>
          <Input
            type="number"
            min={0}
            value={form.poucos_horarios_threshold}
            onChange={(e) => upd("poucos_horarios_threshold", Math.max(0, Number(e.target.value) || 0))}
          />
          <p className="text-[11px] text-slate-400">Dias com até N slots livres aparecem como "poucos horários" (bolinha laranja).</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="text-white" style={{ background: TEAL }}>
          Salvar regras
        </Button>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────
// Calendário admin (visualização mensal)

const WEEKDAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function CalendarioAdmin() {
  const { data: config = DEFAULT_CONFIG } = useConfig();
  const { data: semanal = [] } = useSemanal();
  const { data: excecoes = [] } = useExcecoes();

  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const range = useMemo(() => {
    const first = toISO(new Date(view.getFullYear(), view.getMonth(), 1));
    const last = toISO(new Date(view.getFullYear(), view.getMonth() + 1, 0));
    return { first, last };
  }, [view]);

  const { data: agendamentos = [] } = useQuery({
    queryKey: ["disponibilidade", "agendamentos", range.first, range.last],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("data,horario_inicio,horario_fim,status")
        .gte("data", range.first)
        .lte("data", range.last)
        .neq("status", "cancelado");
      if (error) throw error;
      return data ?? [];
    },
  });

  const status = useMemo(
    () =>
      computeMonthStatus({
        ano: view.getFullYear(),
        mes: view.getMonth(),
        config,
        semanal,
        excecoes,
        agendamentos,
      }),
    [view, config, semanal, excecoes, agendamentos],
  );

  const grid = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const cells: ({ iso: string; day: number } | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push({ iso: toISO(new Date(view.getFullYear(), view.getMonth(), d)), day: d });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  const label = `${MONTH_NAMES[view.getMonth()]} ${view.getFullYear()}`;

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold capitalize text-[#0A1128]">{label}</p>
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {WEEKDAY_LETTERS.map((w, i) => <div key={i} className="py-1">{w}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const st = status[cell.iso];
          const s = st?.status ?? "indisponivel";
          const cls =
            s === "disponivel"
              ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
              : s === "poucos"
                ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                : "bg-slate-50 text-slate-400 border-slate-100";
          return (
            <div
              key={cell.iso}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-sm font-semibold ${cls}`}
              title={`${st?.livres ?? 0} slots livres`}
            >
              <span>{cell.day}</span>
              <span className="text-[10px] font-normal opacity-70">{st?.livres ?? 0}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponível</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Poucos horários</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" /> Indisponível</span>
      </div>
    </Panel>
  );
}
