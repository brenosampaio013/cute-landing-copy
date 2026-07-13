import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, ShieldCheck, Clock, CalendarCheck, Waves,
  MapPin, Check, UserRound, Sparkles, ChevronLeft, ChevronRight,
  AlertCircle, CircleDollarSign,
} from "lucide-react";
import { toast } from "sonner";

import { SitePage } from "@/components/site-page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { computeAvailableSlots, type Slot } from "@/lib/horarios";
import {
  DEFAULT_CONFIG,
  computeGlobalSlots,
  computeMonthStatus,
  type DispConfig,
  type DispExcecao,
  type DispSemanal,
} from "@/lib/disponibilidade";
import iconLimpeza from "@/assets/icon-limpeza.png";
import iconPosObra from "@/assets/icon-posobra.png";
import iconPassadoria from "@/assets/icon-passadoria.png";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar serviço — Maré Nobre" }] }),
  component: Agendar,
});

type ServiceDef = {
  title: string;
  desc: string;
  duracaoMin: number;
  priceFrom: number;
  duracaoLabel: string;
  icon: string | "waves";
};

const services: ServiceDef[] = [
  { title: "Limpeza Padrão", desc: "Manutenção residencial", duracaoMin: 330, priceFrom: 180, duracaoLabel: "4–6h", icon: iconLimpeza },
  { title: "Limpeza Pesada", desc: "Pós-obra ou faxina profunda", duracaoMin: 330, priceFrom: 280, duracaoLabel: "5–7h", icon: iconPosObra },
  { title: "Passadoria", desc: "Roupas engomadas e organizadas", duracaoMin: 240, priceFrom: 120, duracaoLabel: "3–4h", icon: iconPassadoria },
  { title: "Limpeza de Piscina", desc: "Tratamento e higienização", duracaoMin: 180, priceFrom: 150, duracaoLabel: "2–3h", icon: "waves" },
];

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAY_LETTERS = ["D", "S", "T", "Q", "Q", "S", "S"];
const SCARCE_THRESHOLD = 3;

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function formatDataLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const wd = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][dt.getDay()];
  return `${wd}, ${String(d).padStart(2, "0")} de ${MONTH_NAMES[m - 1].toLowerCase()}`;
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

  // Endereço detalhado
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const [submitting, setSubmitting] = useState(false);

  // Mês visível no calendário
  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

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

  const chosenIds = useMemo(
    () => (profId === "any" ? profissionais.map((p) => p.id) : [profId]),
    [profId, profissionais],
  );

  // Range do mês visível para buscar agendamentos
  const monthRange = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    return { firstISO: toISO(first), lastISO: toISO(last) };
  }, [viewMonth]);

  // Grade + bloqueios (não dependem da data)
  const { data: baseDispon } = useQuery({
    queryKey: ["agendar", "base", chosenIds.join(",")],
    enabled: chosenIds.length > 0,
    queryFn: async () => {
      const [h, b] = await Promise.all([
        supabase.from("profissional_horarios").select("*").in("profissional_id", chosenIds),
        supabase.from("profissional_bloqueios").select("*").in("profissional_id", chosenIds),
      ]);
      if (h.error) throw h.error;
      if (b.error) throw b.error;
      return { horarios: h.data ?? [], bloqueios: b.data ?? [] };
    },
  });

  // Agendamentos do mês visível
  const { data: monthAg = [] } = useQuery({
    queryKey: ["agendar", "monthAg", chosenIds.join(","), monthRange.firstISO, monthRange.lastISO],
    enabled: chosenIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("id, profissional_id, data, horario_inicio, horario_fim, status")
        .in("profissional_id", chosenIds)
        .gte("data", monthRange.firstISO)
        .lte("data", monthRange.lastISO);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Camada global de disponibilidade (empresa)
  const { data: dispConfig = DEFAULT_CONFIG } = useQuery({
    queryKey: ["disponibilidade", "config"],
    queryFn: async (): Promise<DispConfig> => {
      const { data, error } = await supabase.from("disponibilidade_config").select("*").maybeSingle();
      if (error) throw error;
      return (data as DispConfig | null) ?? DEFAULT_CONFIG;
    },
    staleTime: 60_000,
  });
  const { data: dispSemanal = [] } = useQuery({
    queryKey: ["disponibilidade", "semanal"],
    queryFn: async (): Promise<DispSemanal[]> => {
      const { data, error } = await supabase
        .from("disponibilidade_semanal")
        .select("id,dia_semana,hora_inicio,hora_fim,ativo");
      if (error) throw error;
      return (data ?? []) as DispSemanal[];
    },
    staleTime: 60_000,
  });
  const { data: dispExcecoes = [] } = useQuery({
    queryKey: ["disponibilidade", "excecoes", monthRange.firstISO, monthRange.lastISO],
    queryFn: async (): Promise<DispExcecao[]> => {
      const { data, error } = await supabase
        .from("disponibilidade_excecoes")
        .select("id,data,tipo,hora_inicio,hora_fim,motivo")
        .gte("data", monthRange.firstISO)
        .lte("data", monthRange.lastISO);
      if (error) throw error;
      return (data ?? []) as DispExcecao[];
    },
    staleTime: 60_000,
  });

  // Todos agendamentos do mês (para capacidade global — inclui outros profissionais)
  const { data: monthAgAll = [] } = useQuery({
    queryKey: ["agendar", "monthAgAll", monthRange.firstISO, monthRange.lastISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("data, horario_inicio, horario_fim, status")
        .gte("data", monthRange.firstISO)
        .lte("data", monthRange.lastISO)
        .neq("status", "cancelado");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // Status do mês pela camada global
  const monthStatus = useMemo(
    () => computeMonthStatus({
      ano: viewMonth.getFullYear(),
      mes: viewMonth.getMonth(),
      config: dispConfig,
      semanal: dispSemanal,
      excecoes: dispExcecoes,
      agendamentos: monthAgAll,
    }),
    [viewMonth, dispConfig, dispSemanal, dispExcecoes, monthAgAll],
  );

  // Slots por dia = interseção (global × por-profissional)
  const daySlotCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (chosenIds.length === 0) return counts;
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const iso = toISO(d);
      if (d < today) { counts.set(iso, 0); continue; }
      const stat = monthStatus[iso];
      if (!stat || stat.status === "indisponivel") { counts.set(iso, 0); continue; }
      const globalSlots = computeGlobalSlots({
        data: iso,
        config: dispConfig,
        semanal: dispSemanal,
        excecoes: dispExcecoes,
        agendamentos: monthAgAll.filter((a) => a.data === iso),
      }).filter((s) => s.livres > 0);
      if (!baseDispon) { counts.set(iso, globalSlots.length); continue; }
      // filtra por presença de ao menos um profissional livre naquele intervalo
      let livres = 0;
      for (const g of globalSlots) {
        for (const id of chosenIds) {
          const horarios = baseDispon.horarios.filter((x) => x.profissional_id === id);
          const bloqueios = baseDispon.bloqueios.filter((x) => x.profissional_id === id);
          const ags = monthAg.filter((x) => x.profissional_id === id && x.data === iso);
          const list = computeAvailableSlots({ data: iso, duracaoMin, horarios, bloqueios, agendamentos: ags, stepMin: 60 });
          if (list.some((s) => s.inicio === g.inicio)) { livres++; break; }
        }
      }
      counts.set(iso, livres);
    }
    return counts;
  }, [baseDispon, monthAg, monthAgAll, chosenIds, viewMonth, duracaoMin, today, dispConfig, dispSemanal, dispExcecoes, monthStatus]);

  // Slots do dia selecionado (interseção global × profissional)
  const slots: Slot[] = useMemo(() => {
    if (!data || chosenIds.length === 0) return [];
    const globalSlots = computeGlobalSlots({
      data,
      config: dispConfig,
      semanal: dispSemanal,
      excecoes: dispExcecoes,
      agendamentos: monthAgAll.filter((a) => a.data === data),
    }).filter((s) => s.livres > 0);
    if (globalSlots.length === 0) return [];
    if (!baseDispon) {
      // Sem restrição por profissional carregada: usa só a camada global
      return globalSlots.map((s) => {
        const [y, mo, d] = data.split("-").map(Number);
        const [hi, mi] = s.inicio.split(":").map(Number);
        const [hf, mf] = s.fim.split(":").map(Number);
        return {
          inicio: s.inicio,
          fim: s.fim,
          inicioISO: new Date(y, (mo || 1) - 1, d || 1, hi, mi).toISOString(),
          fimISO: new Date(y, (mo || 1) - 1, d || 1, hf, mf).toISOString(),
        };
      });
    }
    const map = new Map<string, Slot>();
    for (const id of chosenIds) {
      const horarios = baseDispon.horarios.filter((x) => x.profissional_id === id);
      const bloqueios = baseDispon.bloqueios.filter((x) => x.profissional_id === id);
      const agendamentos = monthAg.filter((x) => x.profissional_id === id && x.data === data);
      const list = computeAvailableSlots({ data, duracaoMin, horarios, bloqueios, agendamentos, stepMin: 60 });
      for (const s of list) {
        if (globalSlots.some((g) => g.inicio === s.inicio)) map.set(`${s.inicio}-${s.fim}`, s);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.inicio.localeCompare(b.inicio));
  }, [data, baseDispon, monthAg, monthAgAll, chosenIds, duracaoMin, dispConfig, dispSemanal, dispExcecoes]);


  // Calendário: matriz de dias
  const monthGrid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const cells: ({ iso: string; day: number } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      cells.push({ iso: toISO(dt), day: d });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const monthLabel = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;
  const isCurrentMonth = viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();

  async function pickProfissionalForSlot(slot: Slot): Promise<string | null> {
    if (profId !== "any") return profId;
    if (!baseDispon) return null;
    for (const p of profissionais) {
      const horarios = baseDispon.horarios.filter((x) => x.profissional_id === p.id);
      const bloqueios = baseDispon.bloqueios.filter((x) => x.profissional_id === p.id);
      const agendamentos = monthAg.filter((x) => x.profissional_id === p.id && x.data === data);
      const list = computeAvailableSlots({ data, duracaoMin, horarios, bloqueios, agendamentos, stepMin: 60 });
      if (list.some((s) => s.inicio === slot.inicio && s.fim === slot.fim)) return p.id;
    }
    return null;
  }

  // ViaCEP
  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) { setCepStatus("idle"); return; }
    let aborted = false;
    setCepStatus("loading");
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((j) => {
        if (aborted) return;
        if (j.erro) { setCepStatus("error"); return; }
        setRua(j.logradouro || "");
        setBairro(j.bairro || "");
        setCidade(j.localidade || "");
        setUf(j.uf || "");
        setCepStatus("ok");
      })
      .catch(() => { if (!aborted) setCepStatus("error"); });
    return () => { aborted = true; };
  }, [cep]);

  function formatCep(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  }

  const enderecoCompleto = useMemo(() => {
    if (!rua || !numero || !cidade) return "";
    const parts = [
      `${rua}, ${numero}`,
      complemento && `${complemento}`,
      bairro,
      `${cidade}${uf ? `/${uf}` : ""}`,
      cep && `CEP ${cep}`,
      referencia && `Ref: ${referencia}`,
    ].filter(Boolean);
    return parts.join(" — ");
  }, [rua, numero, complemento, bairro, cidade, uf, cep, referencia]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Faça login para concluir seu agendamento."); navigate({ to: "/login" }); return; }
    if (!servico || !data || slotIdx === null || !enderecoCompleto) {
      toast.error("Falta pouco! Preencha serviço, data, horário e endereço.");
      return;
    }
    const slot = slots[slotIdx];
    if (!slot) { toast.error("Selecione um horário disponível."); return; }

    setSubmitting(true);
    const chosenProf = await pickProfissionalForSlot(slot);
    if (!chosenProf) {
      setSubmitting(false);
      toast.error("Este horário acabou de ficar indisponível. Escolha outro.");
      return;
    }

    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      profissional_id: chosenProf,
      servico,
      data,
      horario_inicio: slot.inicio,
      horario_fim: slot.fim,
      endereco: enderecoCompleto,
      status: "pendente",
      preco: 0,
      total: 0,
    }).select("id").single();

    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Não conseguimos agendar agora. Tente novamente.");
      return;
    }
    toast.success("Agendamento confirmado! Em instantes você recebe o orçamento.");
    navigate({ to: "/dashboard/agendamentos" });
  }

  // Progresso
  const step1Done = !!servico;
  const step2Done = !!data && slotIdx !== null;
  const step3Done = !!enderecoCompleto;
  const step4Done = false; // confirmação = ao clicar
  const canSubmit = step1Done && step2Done && step3Done && !!user;

  const stepper = [
    { label: "Serviço", done: step1Done },
    { label: "Data e horário", done: step2Done },
    { label: "Endereço", done: step3Done },
    { label: "Confirmação", done: step4Done },
  ];
  const currentStepIdx = stepper.findIndex((s) => !s.done);
  const activeStep = currentStepIdx === -1 ? 3 : currentStepIdx;

  const slotsCount = data ? slots.length : null;
  const scarce = slotsCount !== null && slotsCount > 0 && slotsCount <= SCARCE_THRESHOLD;

  const trustItems = [
    { icon: ShieldCheck, title: "Pagamento seguro" },
    { icon: CalendarCheck, title: "Remarcação fácil" },
    { icon: Clock, title: "Confirmação rápida" },
  ];

  return (
    <SitePage
      eyebrow="Agendamento online"
      title="Agende em 2 minutos"
      subtitle="Escolha o serviço, o horário que cabe na sua rotina e receba a confirmação em instantes."
    >
      {/* Stepper */}
      <nav aria-label="Progresso do agendamento" className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 sm:p-6">
        <ol className="flex items-center gap-2 sm:gap-4">
          {stepper.map((s, i) => {
            const isActive = i === activeStep;
            const isDone = s.done;
            return (
              <li key={s.label} className="flex flex-1 items-center gap-2 sm:gap-3">
                <div className="flex flex-col items-center sm:flex-row sm:gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                      isDone
                        ? "bg-[#2DD4BF] text-white shadow-md shadow-[#2DD4BF]/30"
                        : isActive
                          ? "bg-[#2DD4BF]/15 text-[#0A9E8A] ring-2 ring-[#2DD4BF]"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={`mt-1.5 text-center text-[10px] font-semibold uppercase tracking-wider sm:mt-0 sm:text-xs sm:tracking-normal ${
                      isActive ? "text-[#0A1128]" : isDone ? "text-[#0A9E8A]" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stepper.length - 1 && (
                  <span
                    className={`hidden h-[2px] flex-1 rounded-full transition sm:block ${
                      stepper[i].done ? "bg-[#2DD4BF]" : "bg-slate-200"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Coluna principal */}
        <div className="space-y-8">
          {/* Serviço */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 sm:p-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">O que você precisa hoje?</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">01 · Serviço</span>
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
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
                        <span className="text-[#0A9E8A]">a partir de {formatBRL(s.priceFrom)}</span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3" /> {s.duracaoLabel}
                        </span>
                      </div>
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
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 sm:p-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">Profissional</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Opcional</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => { setProfId("any"); setSlotIdx(null); }}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                  profId === "any" ? "border-[#2DD4BF] bg-[#2DD4BF]/5" : "border-slate-100 bg-white hover:border-slate-200"
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
              {loadingProfs && <div className="col-span-full text-xs text-slate-400">Carregando profissionais…</div>}
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
                      <p className="truncate text-xs text-slate-500">{p.regiao || (p.especialidades?.[0] ?? "Profissional")}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Data e horário */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 sm:p-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">Quando podemos te atender?</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">02 · Data e horário</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              {/* Calendário */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => !isCurrentMonth && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    disabled={isCurrentMonth}
                    aria-label="Mês anterior"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-bold capitalize text-[#0A1128]">{monthLabel}</p>
                  <button
                    type="button"
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    aria-label="Próximo mês"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {WEEKDAY_LETTERS.map((w, i) => <div key={i} className="py-1">{w}</div>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {monthGrid.map((cell, i) => {
                    if (!cell) return <div key={i} />;
                    const count = daySlotCounts.get(cell.iso) ?? 0;
                    const isPast = cell.iso < toISO(today);
                    const unavailable = isPast || count === 0;
                    const isSelected = data === cell.iso;
                    const isScarce = !unavailable && count <= SCARCE_THRESHOLD;
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        disabled={unavailable}
                        onClick={() => { setData(cell.iso); setSlotIdx(null); }}
                        aria-label={`${cell.day} ${MONTH_NAMES[viewMonth.getMonth()]} — ${count} horários`}
                        className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-semibold transition ${
                          isSelected
                            ? "bg-[#2DD4BF] text-white shadow-md shadow-[#2DD4BF]/40"
                            : unavailable
                              ? "cursor-not-allowed text-slate-300"
                              : "text-[#0A1128] hover:bg-[#2DD4BF]/10"
                        }`}
                      >
                        <span>{cell.day}</span>
                        {isScarce && !isSelected && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-400" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Poucos horários</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#2DD4BF]" /> Selecionado</span>
                </div>
              </div>

              {/* Horários */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Horário</p>
                  {data && slots.length > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A9E8A]">
                      {slots.length} disponível{slots.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {scarce && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Poucos horários restantes nesta data
                  </div>
                )}
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {!data && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                      Escolha uma data no calendário.
                    </p>
                  )}
                  {data && slots.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                      Nenhum horário disponível nesta data.
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

          {/* Endereço */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 sm:p-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-[#0A1128] sm:text-xl">Onde será o serviço?</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">03 · Endereço</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">CEP</label>
                <div className="relative">
                  <input
                    inputMode="numeric"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    placeholder="00000-000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2DD4BF] focus:bg-white focus:ring-2 focus:ring-[#2DD4BF]/20"
                  />
                  {cepStatus === "loading" && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                  {cepStatus === "ok" && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0A9E8A]" strokeWidth={3} />
                  )}
                </div>
                {cepStatus === "error" && (
                  <p className="mt-1 text-[11px] text-amber-600">CEP não encontrado. Você pode preencher manualmente.</p>
                )}
                {cepStatus === "ok" && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#0A9E8A]">
                    <Check className="h-3 w-3" strokeWidth={3} /> Endereço encontrado
                  </p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rua</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    placeholder="Preenchido pelo CEP"
                    readOnly={cepStatus === "ok"}
                    className={`w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 ${cepStatus === "ok" ? "bg-slate-100 text-slate-600" : "bg-slate-50 focus:bg-white"}`}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Número</label>
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="123"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2DD4BF] focus:bg-white focus:ring-2 focus:ring-[#2DD4BF]/20"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Complemento</label>
                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, bloco, casa (opcional)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2DD4BF] focus:bg-white focus:ring-2 focus:ring-[#2DD4BF]/20"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bairro</label>
                <input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  readOnly={cepStatus === "ok"}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 ${cepStatus === "ok" ? "bg-slate-100 text-slate-600" : "bg-slate-50 focus:bg-white"}`}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cidade / UF</label>
                <input
                  value={uf ? `${cidade} / ${uf}` : cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  readOnly={cepStatus === "ok"}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 ${cepStatus === "ok" ? "bg-slate-100 text-slate-600" : "bg-slate-50 focus:bg-white"}`}
                />
              </div>

              <div className="sm:col-span-6">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ponto de referência</label>
                <input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ex: próximo à padaria, portão azul (opcional)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2DD4BF] focus:bg-white focus:ring-2 focus:ring-[#2DD4BF]/20"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Painel de resumo (sticky em desktop) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-[#0A1128] p-6 text-white shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2DD4BF]">Resumo do agendamento</p>
            <h3 className="mt-1 text-lg font-bold">Confira antes de confirmar</h3>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Serviço</dt>
                <dd className="mt-0.5 font-semibold">{servico || <span className="text-white/40">completar acima</span>}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Data</dt>
                <dd className="mt-0.5 font-semibold capitalize">
                  {data ? formatDataLong(data) : <span className="text-white/40">completar acima</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Horário</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {slotIdx !== null && slots[slotIdx]
                    ? `${slots[slotIdx].inicio} – ${slots[slotIdx].fim}`
                    : <span className="text-white/40">completar acima</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Endereço</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-white/80">
                  {enderecoCompleto || <span className="text-white/40">completar acima</span>}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#2DD4BF]">
                <CircleDollarSign className="h-3.5 w-3.5" /> Estimativa
              </div>
              <p className="mt-1 text-2xl font-bold text-white">
                a partir de <span className="tabular-nums">{formatBRL(servicoObj.priceFrom)}</span>
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                O valor final é confirmado após os detalhes do imóvel.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || authLoading || !canSubmit}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2DD4BF] px-6 py-4 text-sm font-bold text-[#0A1128] shadow-xl shadow-[#2DD4BF]/30 transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar agendamento
            </button>

            {!user && !authLoading && (
              <p className="mt-2 text-center text-[11px] text-white/50">
                Faça login para concluir.
              </p>
            )}

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
              {trustItems.map(({ icon: Icon, title }) => (
                <div key={title} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon className="h-4 w-4 text-[#2DD4BF]" strokeWidth={1.75} />
                  <span className="text-[10px] font-medium leading-tight text-white/70">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </form>
    </SitePage>
  );
}
