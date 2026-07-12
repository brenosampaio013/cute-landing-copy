import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Calendar as CalIcon, Ban } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, Panel, TEAL } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/horarios")({
  head: () => ({ meta: [{ title: "Horários — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: HorariosPage,
});

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type Prof = { id: string; nome: string };
type Horario = { id: string; profissional_id: string; dia_semana: number; hora_inicio: string; hora_fim: string; ativo: boolean };
type Bloqueio = { id: string; profissional_id: string; data_inicio: string; data_fim: string; motivo: string | null };

function HorariosPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const { data: profs = [] } = useQuery({
    queryKey: ["admin", "profissionais", "min"],
    queryFn: async (): Promise<Prof[]> => {
      const { data, error } = await supabase.from("profissionais").select("id,nome").eq("status", "ativo").order("nome");
      if (error) throw error;
      return data as Prof[];
    },
    enabled: !!user && isAdmin === true,
  });

  const [profId, setProfId] = useState<string>("");
  useEffect(() => { if (!profId && profs[0]) setProfId(profs[0].id); }, [profs, profId]);

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell active="horarios" title="Horários" subtitle="Defina a grade semanal e bloqueios pontuais de cada profissional.">
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <Label className="text-xs text-slate-500">Profissional</Label>
          <Select value={profId} onValueChange={setProfId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
            <SelectContent>{profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
          </Select>
          {profs.length === 0 && <span className="text-xs text-slate-500">Cadastre um profissional ativo em /admin/profissionais.</span>}
        </div>
      </Panel>

      {profId && (
        <div className="mt-6">
          <Tabs defaultValue="grade">
            <TabsList>
              <TabsTrigger value="grade" className="gap-1.5"><CalIcon className="h-4 w-4" /> Grade semanal</TabsTrigger>
              <TabsTrigger value="bloqueios" className="gap-1.5"><Ban className="h-4 w-4" /> Bloqueios</TabsTrigger>
            </TabsList>
            <TabsContent value="grade" className="mt-4"><Grade profId={profId} /></TabsContent>
            <TabsContent value="bloqueios" className="mt-4"><Bloqueios profId={profId} /></TabsContent>
          </Tabs>
        </div>
      )}
    </AdminShell>
  );
}

function Grade({ profId }: { profId: string }) {
  const qc = useQueryClient();
  const { data: horarios = [], isLoading } = useQuery({
    queryKey: ["horarios", profId],
    queryFn: async (): Promise<Horario[]> => {
      const { data, error } = await supabase.from("profissional_horarios")
        .select("id,profissional_id,dia_semana,hora_inicio,hora_fim,ativo")
        .eq("profissional_id", profId).order("dia_semana").order("hora_inicio");
      if (error) throw error;
      return data as Horario[];
    },
  });

  const addMut = useMutation({
    mutationFn: async (v: { dia_semana: number; hora_inicio: string; hora_fim: string }) => {
      const { error } = await supabase.from("profissional_horarios").insert({ profissional_id: profId, ...v, ativo: true });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["horarios", profId] }); toast.success("Horário adicionado à grade."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profissional_horarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["horarios", profId] }); toast.success("Horário removido da grade."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("profissional_horarios").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["horarios", profId] }),
  });

  const grouped = useMemo(() => {
    const g: Record<number, Horario[]> = {};
    for (let i = 0; i < 7; i++) g[i] = [];
    horarios.forEach((h) => g[h.dia_semana].push(h));
    return g;
  }, [horarios]);

  return (
    <Panel>
      {isLoading ? <p className="text-sm text-slate-500">Carregando...</p> : (
        <div className="space-y-4">
          {DIAS.map((nome, dia) => (
            <div key={dia} className="rounded-lg border border-slate-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-[#0A1128]">{nome}</p>
                <AddSlot onAdd={(hi, hf) => addMut.mutate({ dia_semana: dia, hora_inicio: hi, hora_fim: hf })} />
              </div>
              {grouped[dia].length === 0 ? (
                <p className="text-xs text-slate-400">Sem horários — dia fechado.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {grouped[dia].map((h) => (
                    <div key={h.id} className={`group flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${h.ativo ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500 line-through"}`}>
                      <span className="font-medium">{h.hora_inicio.slice(0, 5)} – {h.hora_fim.slice(0, 5)}</span>
                      <button onClick={() => toggleMut.mutate({ id: h.id, ativo: !h.ativo })} className="text-[10px] uppercase tracking-wide opacity-70 hover:opacity-100">{h.ativo ? "Desativar" : "Ativar"}</button>
                      <button onClick={() => delMut.mutate(h.id)} className="opacity-60 hover:text-rose-600 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
      <Button size="sm" onClick={() => { if (hf <= hi) { toast.error("O horário final precisa ser maior que o inicial."); return; } onAdd(hi + ":00", hf + ":00"); }} className="h-8 gap-1 text-white" style={{ background: TEAL }}>
        <Plus className="h-3.5 w-3.5" /> Adicionar
      </Button>
    </div>
  );
}

function Bloqueios({ profId }: { profId: string }) {
  const qc = useQueryClient();
  const { data: bloqueios = [], isLoading } = useQuery({
    queryKey: ["bloqueios", profId],
    queryFn: async (): Promise<Bloqueio[]> => {
      const { data, error } = await supabase.from("profissional_bloqueios")
        .select("id,profissional_id,data_inicio,data_fim,motivo")
        .eq("profissional_id", profId).order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Bloqueio[];
    },
  });

  const [ini, setIni] = useState("");
  const [fim, setFim] = useState("");
  const [motivo, setMotivo] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      if (!ini || !fim) throw new Error("Preencha início e fim");
      if (new Date(fim) <= new Date(ini)) throw new Error("Fim deve ser posterior ao início");
      const { error } = await supabase.from("profissional_bloqueios").insert({
        profissional_id: profId,
        data_inicio: new Date(ini).toISOString(),
        data_fim: new Date(fim).toISOString(),
        motivo: motivo || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bloqueios", profId] }); setIni(""); setFim(""); setMotivo(""); toast.success("Bloqueio criado com sucesso."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profissional_bloqueios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bloqueios", profId] }); toast.success("Bloqueio removido."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <Panel>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto]">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Início</Label>
          <Input type="datetime-local" value={ini} onChange={(e) => setIni(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Fim</Label>
          <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Motivo (opcional)</Label>
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Folga, feriado, imprevisto..." />
        </div>
        <div className="flex items-end">
          <Button onClick={() => addMut.mutate()} disabled={addMut.isPending} className="gap-1 text-white" style={{ background: TEAL }}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Carregando...</p> : bloqueios.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum bloqueio cadastrado. Adicione folgas, feriados ou imprevistos abaixo.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 font-semibold">Início</th>
                <th className="px-3 py-2 font-semibold">Fim</th>
                <th className="px-3 py-2 font-semibold">Motivo</th>
                <th className="px-3 py-2 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bloqueios.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-slate-700">{fmt(b.data_inicio)}</td>
                  <td className="px-3 py-2.5 text-slate-700">{fmt(b.data_fim)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{b.motivo || "—"}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => delMut.mutate(b.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600" title="Remover"><Trash2 className="h-4 w-4" /></button>
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
