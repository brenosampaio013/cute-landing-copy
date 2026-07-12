import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarSearch, CalendarCheck2, CreditCard, UserCheck, ArrowRight } from "lucide-react";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona — Maré Nobre" },
      { name: "description", content: "Do agendamento ao serviço concluído em 4 passos. Rápido, seguro e sem burocracia." },
    ],
  }),
  component: ComoFunciona,
});

const steps = [
  { n: 1, icon: CalendarSearch, title: "Escolha o serviço", desc: "Diga o que você precisa — de pós-obra a piscina — em poucos cliques." },
  { n: 2, icon: CalendarCheck2, title: "Escolha data e horário", desc: "Veja a agenda em tempo real e escolha o horário que cabe na sua rotina." },
  { n: 3, icon: CreditCard, title: "Pagamento seguro", desc: "Pague pelo app com criptografia. Sem dor de cabeça, sem surpresas." },
  { n: 4, icon: UserCheck, title: "Profissional a caminho", desc: "Profissional verificado confirmado — chega no horário e cuida de tudo." },
];

function ComoFunciona() {
  return (
    <SitePage
      eyebrow="Simples e rápido"
      title="Como funciona"
      subtitle="Quatro passos entre o agendamento e o seu lar impecável."
    >
      <div className="relative">
        {/* Connector line for desktop */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden h-[2px] bg-gradient-to-r from-transparent via-[#2DD4BF]/30 to-transparent md:block"
        />
        <div className="relative grid gap-10 md:grid-cols-4 md:gap-6">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#2DD4BF]/40 hover:shadow-xl"
            >
              <div className="relative">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition group-hover:scale-105"
                  style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
                >
                  <s.icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <span
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#0A9E8A] ring-2 ring-[#2DD4BF]/30"
                  aria-hidden
                >
                  {s.n}
                </span>
              </div>
              <span className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2DD4BF]">
                Passo {s.n}
              </span>
              <h3 className="mt-2 text-base font-semibold text-[#0A1A2F]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>


      <div className="mt-16 flex justify-center">
        <Link
          to="/agendar"
          className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
          style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
        >
          Começar agora
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </SitePage>
  );
}
