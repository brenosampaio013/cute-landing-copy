import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Send } from "lucide-react";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Maré Nobre" },
      { name: "description", content: "Entre em contato com a Maré Nobre." },
    ],
  }),
  component: Contato,
});

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2DD4BF] focus:bg-white focus:ring-2 focus:ring-[#2DD4BF]/20";
const labelCls =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400";

function Contato() {
  return (
    <SitePage
      eyebrow="Fale com a gente"
      title="Contato"
      subtitle="Estamos à disposição — respondemos em até 24 horas."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {[
            { icon: Mail, label: "E-mail", value: "contato@marenobre.com" },
            { icon: Phone, label: "Telefone", value: "0800 123 4567" },
            { icon: MapPin, label: "Endereço", value: "Av. Paulista, 1000 — São Paulo, SP" },
          ].map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2DD4BF]/10 text-[#0A9E8A]">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {c.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[#0A1A2F]">
                  {c.value}
                </p>
              </div>
            </div>
          ))}
          <div
            className="rounded-2xl p-5 text-white"
            style={{ background: "var(--gradient-hero)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2DD4BF]">
              Atendimento
            </p>
            <p className="mt-2 text-sm text-white/80">
              Seg. a sáb., das 8h às 20h. Fora desse horário, deixe sua mensagem e
              retornamos rapidamente.
            </p>
          </div>
        </div>

        <form className="space-y-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl ring-1 ring-slate-200/40">
          <div>
            <label className={labelCls}>Nome</label>
            <input className={`${inputCls} mt-2`} placeholder="Seu nome" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelCls}>E-mail</label>
              <input type="email" className={`${inputCls} mt-2`} placeholder="voce@email.com" />
            </div>
            <div>
              <label className={labelCls}>Telefone</label>
              <input className={`${inputCls} mt-2`} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Mensagem</label>
            <textarea rows={5} className={`${inputCls} mt-2 resize-none`} placeholder="Como podemos ajudar?" />
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
            style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
          >
            <Send className="h-4 w-4" />
            Enviar mensagem
          </button>
        </form>
      </div>
    </SitePage>
  );
}
