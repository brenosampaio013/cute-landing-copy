import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, ShieldCheck, Clock, CalendarCheck, Headphones, Waves,
  CalendarDays, MapPin, Check, UserRound, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { SitePage } from "@/components/site-page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { computeAvailableSlots, type Slot } from "@/lib/horarios";
import iconLimpeza from "@/assets/icon-limpeza.png";
import iconPosObra from "@/assets/icon-posobra.png";
import iconPassadoria from "@/assets/icon-passadoria.png";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar serviço — Maré Nobre" }] }),
  component: Agendar,
});

const services = [
  { icon: iconLimpeza, title: "Limpeza Padrão", desc: "Manutenção residencial", duracaoMin: 330 },
  { icon: iconPosObra, title: "Limpeza Pesada", desc: "Pós-obra ou faxina profunda", duracaoMin: 330 },
  { icon: iconPassadoria, title: "Passadoria", desc: "Roupas engomadas e organizadas", duracaoMin: 240 },
  { icon: "waves" as const, title: "Limpeza de Piscina", desc: "Tratamento e higienização", duracaoMin: 180 },
];

const WEEKDAY_ABBR = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Profissional = {
  id: string;
  nome: string;
  regiao: string | null;
  especialidades: string[] | null;
  avaliacao_media: number | null;
};

function Agendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [servico, setServico] = useState<string>(services[0].title);
  const [profId, setProfId] = useState<string>("any");
  const [data, setData] = useState<string>("");
  const [slotIdx, setSlotIdx] = useState<number | null>(null);
  const [endereco, setEndereco] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const servicoObj = services.find((s) => s.title === servico) ?? services[0];
  const duracaoMin = servicoObj.duracaoMin;

  // Profissionais ativos
  const { data: profissionais = [], isLoading: loadingProfs } = useQuery({
    queryKey: ["agendar", "profissionais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, nome, regiao, especialidades, avaliacao_media")
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Profissional[];
    },
  });

  // Grade + bloqueios + agendamentos do profissional selecionado (ou todos ativos)
  const { data: disponibilidade } = useQuery({
    queryKey: ["agendar", "disponibilidade", profId, data, profissionais.map((p) => p.id).join(",")],
    enabled: !!data && (profId === "any" ? profissionais.length > 0 : true),
    queryFn: async () => {
      const ids = profId === "any" ? profissionais.map((p) => p.id) : [profId];
      if (ids.length === 0) return { horarios: [], bloqueios: [], agendamentos: [] };

      const [h, b, a] = await Promise.all([
        supabase.from("profissional_horarios").select("*").in("profissional_id", ids),
        supabase.from("profissional_bloqueios").select("*").in("profissional_id", ids),
        supabase
          .from("agendamentos")
          .select("id, profissional_id, data, horario_inicio, horario_fim, status")
          .in("profissional_id", ids)
          .eq("data", data),
      ]);
      if (h.error) throw h.error;
      if (b.error) throw b.error;
      if (a.error) throw a.error;
      return {
        horarios: h.data ?? [],
        bloqueios: b.data ?? [],
        agendamentos: a.data ?? [],
      };
    },
  });

  // Slots calculados
  const slots: Slot[] = useMemo(() => {
    if (!data || !disponibilidade) return [];
    const ids = profId === "any" ? profissionais.map((p) => p.id) : [profId];
    if (ids.length === 0) return [];

    // Se "qualquer profissional", união dos slots de todos os ativos
    // (um horário aparece se ao menos um profissional o oferece).
    const map = new Map<string, Slot>();
    for (const id of ids) {
      const horarios = disponibilidade.horarios.filter((x) => x.profissional_id === id);
      const bloqueios = disponibilidade.bloqueios.filter((x) => x.profissional_id === id);
      const agendamentos = disponibilidade.agendamentos.filter((x) => x.profissional_id === id);
      const list = computeAvailableSlots({
        data,
        duracaoMin,
        horarios,
        bloqueios,
        agendamentos,
        stepMin: 60,
      });
      for (const s of list) {
        map.set(`${s.inicio}-${s.fim}`, s);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [data, disponibilidade, profId, profissionais, duracaoMin]);

  const quickDates = useMemo(() => {
    const arr: { iso: string; wd: string; day: string }[] = [];
    const base = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push({
        iso: toISO(d),
        wd: WEEKDAY_ABBR[d.getDay()],
        day: String(d.getDate()).padStart(2, "0"),
      });
    }
    return arr;
  }, []);

  const extraDate = useMemo(() => {
    if (!data) return null;
    if (quickDates.some((q) => q.iso === data)) return null;
    const [y, m, d] = data.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      iso: data,
      wd: WEEKDAY_ABBR[dt.getDay()],
      day: String(dt.getDate()).padStart(2, "0"),
    };
  }, [data, quickDates]);

  async function pickProfissionalForSlot(slot: Slot): Promise<string | null> {
    if (profId !== "any") return profId;
    if (!disponibilidade) return null;
    // Escolhe o primeiro profissional ativo que cubra este slot.
    for (const p of profissionais) {
      const horarios = disponibilidade.horarios.filter((x) => x.profissional_id === p.id);
      const bloqueios = disponibilidade.bloqueios.filter((x) => x.profissional_id === p.id);
      const agendamentos = disponibilidade.agendamentos.filter((x) => x.profissional_id === p.id);
      const list = computeAvailableSlots({
        data,
        duracaoMin,
        horarios,
        bloqueios,
        agendamentos,
        stepMin: 60,
      });
      if (list.some((s) => s.inicio === slot.inicio && s.fim === slot.fim)) return p.id;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Faça login para concluir seu agendamento."); navigate({ to: "/login" }); return; }
    if (!servico || !data || slotIdx === null || !endereco.trim()) {
      toast.error("Falta pouco! Preencha serviço, data, horário e endereço.");
      return;
    }
    const slot = slots[slotIdx];
    if (!slot) { toast.error("Selecione um horário disponível para continuar."); return; }

    setSubmitting(true);
    const chosenProf = await pickProfissionalForSlot(slot);
    if (!chosenProf) {
      setSubmitting(false);
      toast.error("Este horário acabou de ficar indisponível. Escolha outro — a agenda atualiza em tempo real.");
      return;
    }

    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      profissional_id: chosenProf,
      servico,
      data,
      horario_inicio: slot.inicio,
      horario_fim: slot.fim,
      endereco: endereco.trim(),
      status: "pendente",
      preco: 0,
      total: 0,
    }).select("id").single();

    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Não conseguimos agendar agora. Confira sua conexão e tente novamente.");
      return;
    }

    toast.success("Agendamento confirmado! Em instantes você recebe o orçamento.");
    navigate({ to: "/dashboard/agendamentos" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dateOptions = extraDate ? [...quickDates, extraDate] : quickDates;

  const step1Done = !!servico;
  const step2Done = !!data && slotIdx !== null;
  const step3Done = endereco.trim().length > 0;
  const canSubmit = step1Done && step2Done && step3Done && !!user;

  const steps = [
    { n: 1, label: "Escolha o Serviço", active: true, done: step1Done },
    { n: 2, label: "Data e Horário", active: step1Done, done: step2Done },
    { n: 3, label: "Endereço", active: step2Done, done: step3Done },
  ];

  const trustItems = [
    { icon: ShieldCheck, title: "Pagamento seguro", desc: "Seus dados protegidos" },
    { icon: Clock, title: "Agendamento rápido", desc: "Confirmação em minutos" },
    { icon: CalendarCheck, title: "Remarcação fácil", desc: "Altere quando precisar" },
    { icon: Headphones, title: "Suporte dedicado", desc: "Atendimento humanizado" },
  ];

  return (
    <SitePage
      eyebrow="Agendamento online"
      title="Agende em 2 minutos"
      subtitle="Escolha o serviço, o horário que cabe na sua rotina e receba a confirmação em instantes."
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/60 md:flex"
      >
        <aside className="w-full bg-[#0A1128] p-6 text-white sm:p-8 md:w-80 md:shrink-0 md:p-10">
          <div className="mb-6 md:mb-10">
            <h1 className="text-2xl font-bold tracking-tight">Maré Nobre</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#2DD4BF]">
              Serviços Premium
            </p>
          </div>

          <ol className="space-y-5 md:space-y-7">
            {steps.map((s) => (
              <li key={s.n} className={`flex items-center gap-4 transition-opacity ${s.active ? "opacity-100" : "opacity-50"}`}>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    s.done
                      ? "bg-[#2DD4BF] text-white shadow-lg shadow-[#2DD4BF]/30"
                      : s.active
                        ? "bg-[#2DD4BF]/15 text-[#2DD4BF] ring-2 ring-[#2DD4BF]/40"
                        : "border-2 border-white/20 text-white/70"
                  }`}
                >
                  {s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
                </span>
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${s.done || s.active ? "text-[#2DD4BF]" : "text-white/70"}`}>
                    Passo {s.n}
                  </p>
                  <p className="text-sm font-medium">{s.label}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <div className="flex-1 space-y-10 p-6 sm:p-8 md:p-12">
          {/* Passo 1: Serviço */}
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">O que você precisa hoje?</h2>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:inline">01 · Serviço</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {services.map((s) => {
                const active = servico === s.title;
                return (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => { setServico(s.title); setSlotIdx(null); }}
                    className={`group relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition ${
                      active
                        ? "border-[#2DD4BF] bg-[#2DD4BF]/5 shadow-md shadow-[#2DD4BF]/10"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${active ? "bg-white shadow-sm" : "bg-slate-100 group-hover:bg-white"}`}>
                      {s.icon === "waves" ? (
                        <Waves className={`h-6 w-6 ${active ? "text-[#0A9E8A]" : "text-slate-500"}`} strokeWidth={1.75} />
                      ) : (
                        <img src={s.icon} alt="" className="h-7 w-7 object-contain" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#0A1128]">{s.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                    </div>
                    {active && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#2DD4BF] text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Profissional */}
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">Profissional</h2>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:inline">Opcional</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => { setProfId("any"); setSlotIdx(null); }}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                  profId === "any"
                    ? "border-[#2DD4BF] bg-[#2DD4BF]/5"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2DD4BF]/10 text-[#0A9E8A]">
                  <Sparkles className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0A1128]">Qualquer profissional</p>
                  <p className="text-xs text-slate-500">Escolhemos o melhor disponível</p>
                </div>
              </button>

              {loadingProfs && (
                <div className="col-span-full text-xs text-slate-400">Carregando profissionais…</div>
              )}

              {profissionais.map((p) => {
                const active = profId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProfId(p.id); setSlotIdx(null); }}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                      active ? "border-[#2DD4BF] bg-[#2DD4BF]/5" : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserRound className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#0A1128]">{p.nome}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p.regiao || (p.especialidades?.[0] ?? "Profissional")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Passo 2: Data e horário */}
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">Quando podemos te atender?</h2>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:inline">02 · Data e horário</span>
            </div>

            <input
              ref={dateInputRef}
              type="date"
              min={today}
              value={data}
              onChange={(e) => { setData(e.target.value); setSlotIdx(null); }}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Escolha a data</p>
                <div className="grid grid-cols-3 gap-2">
                  {dateOptions.map((d) => {
                    const active = data === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => { setData(d.iso); setSlotIdx(null); }}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 py-3 transition ${
                          active ? "border-[#2DD4BF] bg-[#2DD4BF]/5 shadow-sm" : "border-slate-100 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-[#0A9E8A]" : "text-slate-400"}`}>{d.wd}</span>
                        <span className="text-xl font-bold text-[#0A1128]">{d.day}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = dateInputRef.current;
                    if (!el) return;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const anyEl = el as any;
                    if (typeof anyEl.showPicker === "function") anyEl.showPicker();
                    else el.focus();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
                >
                  <CalendarDays className="h-4 w-4" />
                  Ver mais datas
                </button>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Horário</p>
                  {data && slots.length > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A9E8A]">
                      {slots.length} disponível{slots.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {!data && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                      Escolha uma data para ver horários.
                    </p>
                  )}
                  {data && slots.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                      Nenhum horário disponível nesta data. Tente outra data ou profissional.
                    </p>
                  )}
                  {slots.map((s, idx) => {
                    const active = slotIdx === idx;
                    return (
                      <button
                        key={`${s.inicio}-${s.fim}`}
                        type="button"
                        onClick={() => setSlotIdx(idx)}
                        className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-semibold tabular-nums transition ${
                          active
                            ? "border-[#2DD4BF] bg-[#2DD4BF]/5 text-[#0A1128] shadow-sm"
                            : "border-slate-100 bg-slate-50 text-[#0A1128] hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <span>{s.inicio} – {s.fim}</span>
                        {active && <Check className="h-4 w-4 text-[#0A9E8A]" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Passo 3: Endereço */}
          <section>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">Onde será o serviço?</h2>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:inline">03 · Endereço</span>
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2DD4BF] focus:bg-white focus:ring-2 focus:ring-[#2DD4BF]/20"
                placeholder="Rua, número, bairro e cidade"
              />
            </div>
          </section>

          <div className="rounded-2xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/5 px-4 py-3 text-sm text-[#0A1128]">
            Após o agendamento, enviaremos um orçamento personalizado para o serviço escolhido.
          </div>

          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500">
              {canSubmit ? "Tudo pronto para confirmar." : "Preencha os passos ao lado para continuar."}
            </span>
            <button
              type="submit"
              disabled={submitting || authLoading || !canSubmit}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0A1128] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#0A1128]/20 transition hover:-translate-y-0.5 hover:bg-[#152145] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar agendamento
            </button>
          </div>
          {!user && !authLoading && (
            <p className="mt-2 text-center text-xs text-slate-400 sm:text-right">
              Você precisa estar logado para concluir o agendamento.
            </p>
          )}
        </div>
      </form>

      <div className="mt-10 grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2DD4BF]/10 text-[#0A9E8A]">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0A1128]">{title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
