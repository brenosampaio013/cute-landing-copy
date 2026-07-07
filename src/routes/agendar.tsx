import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Loader2, ShieldCheck, Clock, CalendarCheck, Headphones, Waves, CalendarDays, Tag } from "lucide-react";
import { toast } from "sonner";

import { SitePage } from "@/components/site-page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import iconLimpeza from "@/assets/icon-limpeza.png";
import iconPosObra from "@/assets/icon-posobra.png";
import iconPassadoria from "@/assets/icon-passadoria.png";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar serviço — Maré Nobre" }] }),
  component: Agendar,
});

const services = [
  { icon: iconLimpeza, title: "Limpeza Padrão" },
  { icon: iconPosObra, title: "Limpeza Pesada" },
  { icon: iconPassadoria, title: "Passadoria" },
  { icon: "waves" as const, title: "Limpeza de Piscina" },
];

type Slot = { inicio: string; fim: string; cheaper?: boolean };

const SLOTS: Slot[] = [
  { inicio: "07:00", fim: "12:30", cheaper: true },
  { inicio: "08:00", fim: "13:30" },
  { inicio: "09:00", fim: "14:30", cheaper: true },
  { inicio: "10:00", fim: "15:30" },
  { inicio: "13:00", fim: "18:30" },
  { inicio: "14:00", fim: "19:30", cheaper: true },
];

const WEEKDAY_ABBR = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Agendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [servico, setServico] = useState<string>(services[0].title);
  const [data, setData] = useState<string>("");
  const [slotIdx, setSlotIdx] = useState<number | null>(null);
  const [endereco, setEndereco] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Faça login para agendar."); navigate({ to: "/login" }); return; }
    if (!servico || !data || slotIdx === null || !endereco.trim()) {
      toast.error("Preencha serviço, data, horário e endereço.");
      return;
    }

    const slot = SLOTS[slotIdx];
    const inicio = new Date(`${data}T${slot.inicio}:00`);
    if (Number.isNaN(inicio.getTime())) { toast.error("Data ou horário inválido."); return; }
    if (inicio.getTime() <= Date.now()) { toast.error("Escolha uma data e horário futuros."); return; }

    setSubmitting(true);

    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      profissional_id: null,
      servico,
      data,
      horario_inicio: slot.inicio,
      horario_fim: slot.fim,
      endereco: endereco.trim(),
      status: "pendente",
    }).select("id").single();

    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível agendar. Tente novamente.");
      return;
    }

    toast.success("Agendamento criado! Enviaremos o orçamento em seguida.");
    navigate({ to: "/dashboard/agendamentos" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2DD4BF] focus:bg-white focus:ring-2 focus:ring-[#2DD4BF]/20";
  const stepLabelCls =
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400";
  const sectionLabelCls =
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500";
  const StepBadge = ({ n, active = false }: { n: number; active?: boolean }) => (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        active ? "bg-[#2DD4BF]/15 text-[#0A9E8A]" : "bg-slate-100 text-slate-500"
      }`}
    >
      {n}
    </span>
  );

  const CheapLegend = () => (
    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-500">
        <Tag className="h-3 w-3" strokeWidth={2.25} />
      </span>
      Opções mais baratas
    </div>
  );

  const trustItems = [
    { icon: ShieldCheck, title: "Pagamento seguro", desc: "Seus dados protegidos" },
    { icon: Clock, title: "Agendamento rápido", desc: "Confirmação em minutos" },
    { icon: CalendarCheck, title: "Remarcação fácil", desc: "Altere quando precisar" },
    { icon: Headphones, title: "Suporte dedicado", desc: "Atendimento humanizado" },
  ];

  const canSubmit = !!data && slotIdx !== null && endereco.trim().length > 0 && !!user;

  const dateOptions = extraDate ? [...quickDates, extraDate] : quickDates;

  return (
    <SitePage
      eyebrow="Agendamento online"
      title="Agendar serviço"
      subtitle="Escolha o serviço, a data e o horário. Confirmação em minutos."
    >
      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 lg:grid-cols-12"
      >
        {/* Card esquerdo: serviços */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
          <div className="mb-6 flex items-center gap-3">
            <StepBadge n={1} active />
            <h2 className={stepLabelCls}>Escolha o serviço</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {services.map((s) => {
              const active = servico === s.title;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setServico(s.title)}
                  className={`group relative flex flex-col items-center rounded-2xl border-2 p-5 text-center transition ${
                    active
                      ? "border-[#2DD4BF] bg-white shadow-md"
                      : "border-slate-100 bg-white hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl transition ${
                      active ? "bg-[#2DD4BF]/10" : "bg-slate-50 group-hover:bg-[#2DD4BF]/5"
                    }`}
                  >
                    {s.icon === "waves" ? (
                      <Waves className="h-9 w-9 text-[#2DD4BF]" strokeWidth={1.75} />
                    ) : (
                      <img src={s.icon} alt="" className="h-9 w-9 object-contain" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[#0A1A2F]">{s.title}</span>
                  {active && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#2DD4BF] text-white">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card direito: formulário */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl ring-1 ring-slate-200/40 sm:p-8 lg:col-span-5">
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <StepBadge n={2} active={!!data || slotIdx !== null} />
                <label className={stepLabelCls}>Data e horário</label>
              </div>

              {/* hidden native date input for "Ver mais" */}
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

              <div className="grid gap-5 md:grid-cols-2">
                {/* Coluna esquerda: datas */}
                <div>
                  <p className={sectionLabelCls}>Escolha a data</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {dateOptions.map((d) => {
                      const active = data === d.iso;
                      return (
                        <button
                          key={d.iso}
                          type="button"
                          onClick={() => { setData(d.iso); setSlotIdx(null); }}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 py-3 transition ${
                            active
                              ? "border-[#2DD4BF] bg-[#2DD4BF]/10 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            {d.wd}
                          </span>
                          <span className={`text-lg font-bold ${active ? "text-[#0A9E8A]" : "text-[#0A1A2F]"}`}>
                            {d.day}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        const el = dateInputRef.current;
                        if (!el) return;
                        // showPicker is supported on modern browsers; fallback to focus
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const anyEl = el as any;
                        if (typeof anyEl.showPicker === "function") anyEl.showPicker();
                        else el.focus();
                      }}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-[#0A1A2F]"
                    >
                      <CalendarDays className="h-4 w-4 text-slate-500" />
                      Ver mais
                    </button>
                  </div>
                  <CheapLegend />
                </div>

                {/* Coluna direita: horários */}
                <div>
                  <p className={sectionLabelCls}>Horário</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {SLOTS.map((s, idx) => {
                      const active = slotIdx === idx;
                      const disabled = !data;
                      return (
                        <button
                          key={`${s.inicio}-${s.fim}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSlotIdx(idx)}
                          className={`relative rounded-xl border-2 px-2 py-3 text-xs font-semibold transition ${
                            active
                              ? "border-[#2DD4BF] bg-[#2DD4BF] text-white shadow-md"
                              : "border-slate-200 bg-white text-[#0A1A2F] hover:border-slate-300"
                          } ${disabled ? "cursor-not-allowed opacity-50 hover:border-slate-200" : ""}`}
                        >
                          {s.cheaper && (
                            <span
                              className={`absolute left-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-md ${
                                active ? "bg-white/20 text-white" : "bg-blue-50 text-blue-500"
                              }`}
                              aria-label="Opção mais barata"
                            >
                              <Tag className="h-2.5 w-2.5" strokeWidth={2.5} />
                            </span>
                          )}
                          {s.inicio} - {s.fim}
                        </button>
                      );
                    })}
                  </div>
                  <CheapLegend />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <StepBadge n={3} active={endereco.trim().length > 0} />
                <label className={stepLabelCls}>Endereço</label>
              </div>
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={inputCls}
                placeholder="Rua, número, bairro e cidade"
              />
            </div>

            <div className="rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-4 py-3 text-sm text-[#0A1A2F]">
              Após o agendamento, enviaremos um orçamento personalizado para o serviço escolhido.
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || authLoading || !canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2DD4BF] px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-[#2DD4BF]/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar agendamento
              </button>
              {!user && !authLoading && (
                <p className="mt-4 text-center text-xs text-slate-400">
                  Você precisa estar logado para concluir o agendamento.
                </p>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="mt-10 grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2DD4BF]/10 text-[#0A9E8A]">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0A1A2F]">{title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
