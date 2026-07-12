import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Send, Clock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Maré Nobre" },
      { name: "description", content: "Fale com a Maré Nobre pelo WhatsApp ou e-mail. Resposta em minutos, atendimento humano e sem robôs." },
    ],
  }),
  component: Contato,
});

const WHATSAPP = "5513998068265";
const WHATSAPP_DISPLAY = "(13) 99806-8265";
const EMAIL = "atendimentomarenobre@gmail.com";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#2DD4BF] focus:ring-4 focus:ring-[#2DD4BF]/15";
const labelCls =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500";

function Contato() {
  const channels = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: WHATSAPP_DISPLAY,
      hint: "Resposta em minutos — atendimento humano",
      href: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
        "Olá! Gostaria de solicitar um orçamento com a Maré Nobre."
      )}`,
      external: true,
      accent: "from-emerald-400 to-teal-500",
    },
    {
      icon: Mail,
      label: "E-mail",
      value: EMAIL,
      hint: "Retorno em até 24h",
      href: `mailto:${EMAIL}`,
      external: false,
      accent: "from-sky-400 to-indigo-500",
    },
  ];

  return (
    <SitePage
      eyebrow="Fale com a gente"
      title="Contato"
      subtitle="Escolha o canal que preferir — nossa equipe responde com rapidez e cordialidade."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* Left: channels */}
        <div className="min-w-0 space-y-4">

          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2DD4BF]/40 hover:shadow-lg sm:gap-5 sm:p-5"
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${c.accent} text-white shadow-md`}
              >
                <c.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {c.label}
                </p>
                <p className="mt-1 truncate text-[15px] font-semibold text-[#0A1A2F]">
                  {c.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{c.hint}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0A9E8A]" />
            </a>
          ))}

          <div
            className="relative overflow-hidden rounded-2xl p-6 text-white"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#2DD4BF]/20 blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#2DD4BF]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2DD4BF]">
                  Horário de atendimento
                </p>
              </div>
              <div className="space-y-1.5 text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <span>Segunda a sexta</span>
                  <span className="font-semibold text-white">8h — 20h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sábado</span>
                  <span className="font-semibold text-white">8h — 18h</span>
                </div>
                <div className="flex items-center justify-between text-white/60">
                  <span>Domingo</span>
                  <span>Sob demanda</span>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/60">
                <ShieldCheck className="h-4 w-4 text-[#2DD4BF]" />
                Atendimento humano — sem robôs.
              </div>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <form className="space-y-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl ring-1 ring-slate-200/40" aria-label="Formulário de contato">
          <div className="mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0A9E8A]">
              Envie uma mensagem
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[#0A1A2F]">
              Conte pra gente como podemos ajudar
            </h3>
          </div>
          <div>
            <label htmlFor="contato-nome" className={labelCls}>Nome</label>
            <input id="contato-nome" name="nome" autoComplete="name" required className={`${inputCls} mt-2`} placeholder="Seu nome completo" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contato-email" className={labelCls}>E-mail</label>
              <input id="contato-email" name="email" type="email" autoComplete="email" required className={`${inputCls} mt-2`} placeholder="voce@email.com" />
            </div>
            <div>
              <label htmlFor="contato-telefone" className={labelCls}>Telefone</label>
              <input id="contato-telefone" name="telefone" type="tel" autoComplete="tel" inputMode="tel" className={`${inputCls} mt-2`} placeholder="(13) 99999-9999" />
            </div>
          </div>
          <div>
            <label htmlFor="contato-mensagem" className={labelCls}>Mensagem</label>
            <textarea id="contato-mensagem" name="mensagem" rows={5} required className={`${inputCls} mt-2 resize-none`} placeholder="Como podemos ajudar?" />
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
            style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
          >
            <Send className="h-4 w-4" />
            Enviar mensagem
          </button>
          <p className="text-center text-xs text-slate-400">
            Ao enviar, você concorda em receber contato da Maré Nobre.
          </p>
        </form>

      </div>
    </SitePage>
  );
}
