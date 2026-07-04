import { createFileRoute } from "@tanstack/react-router";
import { Calendar, CreditCard, UserCheck } from "lucide-react";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona — Maré Nobre" },
      { name: "description", content: "Entenda em 4 passos como funciona a Maré Nobre." },
    ],
  }),
  component: ComoFunciona,
});

const steps = [
  { n: 1, icon: Calendar, title: "Escolha o serviço", desc: "Selecione o serviço que você precisa." },
  { n: 2, icon: Calendar, title: "Escolha data e horário", desc: "Agende o melhor dia e horário para você." },
  { n: 3, icon: CreditCard, title: "Pagamento seguro", desc: "Pague com segurança na plataforma." },
  { n: 4, icon: UserCheck, title: "Profissional confirmado", desc: "Pronto! Seu profissional está a caminho." },
];

function ComoFunciona() {
  return (
    <SitePage title="Como funciona" subtitle="Quatro passos simples entre o agendamento e o seu lar impecável.">
      <div className="grid gap-10 md:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#19C6C5] text-white">
              <s.icon className="h-8 w-8" strokeWidth={1.75} />
            </div>
            <h3 className="mt-6 text-base font-semibold text-[#0A1A2F]">{s.n}. {s.title}</h3>
            <p className="mt-2 max-w-[220px] text-sm text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
