import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, X, ShieldCheck, Clock, CalendarCheck, Headphones } from "lucide-react";
import { toast } from "sonner";

import { SitePage } from "@/components/site-page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";
import iconMontagem from "@/assets/icon-montagem.png";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar serviço — Maré Nobre" }] }),
  component: Agendar,
});

const services = [
  { icon: iconLimpeza.url, title: "Limpeza Padrão", preco: 180 },
  { icon: iconPosObra.url, title: "Limpeza Pesada", preco: 350 },
  { icon: iconPassadoria.url, title: "Passadoria", preco: 90 },
  { icon: iconMontagem, title: "Montagem de Móveis", preco: 220 },
];

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type CupomValidado = {
  cupom_id: string;
  codigo: string;
  tipo: string;
  desconto: number;
  total_final: number;
};

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
  const [cupomInput, setCupomInput] = useState("");
  const [cupom, setCupom] = useState<CupomValidado | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);

  const servicoSelecionado = services.find((s) => s.title === servico) ?? services[0];
  const precoBase = servicoSelecionado.preco;
  const desconto = cupom?.desconto ?? 0;
  const total = Math.max(0, precoBase - desconto);

  async function aplicarCupom() {
    if (!cupomInput.trim()) return;
    if (!user) { toast.error("Faça login para aplicar cupom."); return; }
    setValidandoCupom(true);
    const { data, error } = await supabase.rpc("validar_cupom", {
      p_codigo: cupomInput.trim().toUpperCase(),
      p_valor_pedido: precoBase,
    });
    setValidandoCupom(false);
    if (error) { toast.error("Erro ao validar cupom."); return; }
    const res = data as { valido: boolean; motivo?: string } & CupomValidado;
    if (!res.valido) { toast.error(res.motivo ?? "Cupom inválido"); setCupom(null); return; }
    setCupom({ cupom_id: res.cupom_id, codigo: res.codigo, tipo: res.tipo, desconto: Number(res.desconto), total_final: Number(res.total_final) });
    toast.success(`Cupom aplicado: -${brl(Number(res.desconto))}`);
  }

  function removerCupom() { setCupom(null); setCupomInput(""); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.error("Faça login para agendar."); navigate({ to: "/login" }); return; }
    if (!servico || !data || !horario) { toast.error("Preencha serviço, data e horário."); return; }

    const inicio = new Date(`${data}T${horario}:00`);
    if (Number.isNaN(inicio.getTime())) { toast.error("Data ou horário inválido."); return; }
    if (inicio.getTime() <= Date.now()) { toast.error("Escolha uma data e horário futuros."); return; }

    const horarioFim = addHour(horario);
    setSubmitting(true);

    // Re-valida cupom no servidor antes de inserir (evita race)
    let cupomFinal: CupomValidado | null = null;
    if (cupom) {
      const { data: rev, error: revErr } = await supabase.rpc("validar_cupom", {
        p_codigo: cupom.codigo, p_valor_pedido: precoBase,
      });
      const r = rev as { valido: boolean; motivo?: string } & CupomValidado;
      if (revErr || !r?.valido) {
        setSubmitting(false);
        toast.error(r?.motivo ?? "Cupom não é mais válido");
        setCupom(null);
        return;
      }
      cupomFinal = { cupom_id: r.cupom_id, codigo: r.codigo, tipo: r.tipo, desconto: Number(r.desconto), total_final: Number(r.total_final) };
    }

    const { data: novo, error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      profissional_id: null,
      servico,
      data,
      horario_inicio: horario,
      horario_fim: horarioFim,
      endereco: endereco || null,
      status: "pendente",
    }).select("id").single();

    if (error || !novo) {
      setSubmitting(false);
      toast.error("Não foi possível agendar. Tente novamente.");
      return;
    }

    if (cupomFinal) {
      const { error: usoErr } = await supabase.from("cupom_usos").insert({
        cupom_id: cupomFinal.cupom_id,
        cliente_id: user.id,
        agendamento_id: novo.id,
        valor_pedido: precoBase,
        valor_desconto: cupomFinal.desconto,
      });
      if (usoErr) {
        // Agendamento criado, mas cupom não registrado — apenas avisa
        toast.warning("Agendamento criado, mas o cupom não pôde ser registrado.");
      }
    }

    setSubmitting(false);
    toast.success("Agendamento criado!");
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

  return (
    <SitePage
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
                    <img src={s.icon} alt="" className="h-9 w-9 object-contain" />
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

            <div>
              <div className="mb-3 flex items-center gap-3">
                <StepBadge n={4} />
                <label className={stepLabelCls}>Cupom de desconto</label>
              </div>
              {cupom ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="font-mono font-semibold text-emerald-700">{cupom.codigo}</span>
                    <span className="text-emerald-700">−{brl(cupom.desconto)}</span>
                  </div>
                  <button type="button" onClick={removerCupom} className="text-slate-400 hover:text-slate-600" aria-label="Remover cupom">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={cupomInput}
                    onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                    className={`${inputCls} font-mono uppercase`}
                    placeholder="EX: MARE10"
                    maxLength={40}
                  />
                  <button
                    type="button"
                    onClick={aplicarCupom}
                    disabled={validandoCupom || !cupomInput.trim()}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {validandoCupom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-slate-600"><span>Serviço</span><span>{brl(precoBase)}</span></div>
              {desconto > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Desconto</span><span>−{brl(desconto)}</span></div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-[#0A1A2F]"><span>Total</span><span>{brl(total)}</span></div>
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
    </SitePage>
  );
}

