import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, Clock, CalendarCheck, Headphones, Waves } from "lucide-react";
import { toast } from "sonner";

import { SitePage } from "@/components/site-page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar serviço — Maré Nobre" }] }),
  component: Agendar,
});

const services = [
  { icon: iconLimpeza.url, title: "Limpeza Padrão" },
  { icon: iconPosObra.url, title: "Limpeza Pesada" },
  { icon: iconPassadoria.url, title: "Passadoria" },
  { icon: "waves" as const, title: "Limpeza de Piscina" },
];

function addHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Agendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [servico, setServico] = useState<string>(services[0].title);
  const [data, setData] = useState<string>("");
  const [horario, setHorario] = useState<string>("");
  const [endereco, setEndereco] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Faça login para agendar."); navigate({ to: "/login" }); return; }
    if (!servico || !data || !horario) { toast.error("Preencha serviço, data e horário."); return; }

    const inicio = new Date(`${data}T${horario}:00`);
    if (Number.isNaN(inicio.getTime())) { toast.error("Data ou horário inválido."); return; }
    if (inicio.getTime() <= Date.now()) { toast.error("Escolha uma data e horário futuros."); return; }

    const horarioFim = addHour(horario);
    setSubmitting(true);

    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      profissional_id: null,
      servico,
      data,
      horario_inicio: horario,
      horario_fim: horarioFim,
      endereco: endereco || null,
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
  const StepBadge = ({ n, active = false }: { n: number; active?: boolean }) => (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        active ? "bg-[#2DD4BF]/15 text-[#0A9E8A]" : "bg-slate-100 text-slate-500"
      }`}
    >
      {n}
    </span>
  );

  const trustItems = [
    { icon: ShieldCheck, title: "Pagamento seguro", desc: "Seus dados protegidos" },
    { icon: Clock, title: "Agendamento rápido", desc: "Confirmação em minutos" },
    { icon: CalendarCheck, title: "Remarcação fácil", desc: "Altere quando precisar" },
    { icon: Headphones, title: "Suporte dedicado", desc: "Atendimento humanizado" },
  ];

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
              <div className="mb-3 flex items-center gap-3">
                <StepBadge n={2} />
                <label className={stepLabelCls}>Data e horário</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  required
                  min={today}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={inputCls}
                />
                <input
                  type="time"
                  required
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-3">
                <StepBadge n={3} />
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
                disabled={submitting || authLoading}
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

