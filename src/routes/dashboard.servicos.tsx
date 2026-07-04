import { createFileRoute } from "@tanstack/react-router";
import { Home, Sparkles, Shirt, Wrench, Zap, Leaf, ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";

export const Route = createFileRoute("/dashboard/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Maré Nobre" }] }),
  component: Servicos,
});

const services = [
  { icon: Home, title: "Limpeza Residencial", desc: "Diária, semanal ou mensal.", from: "R$ 120" },
  { icon: Sparkles, title: "Limpeza Pós-obra", desc: "Remoção de resíduos e detalhamento.", from: "R$ 380" },
  { icon: Shirt, title: "Passadoria", desc: "Suas roupas passadas com cuidado.", from: "R$ 90" },
  { icon: Wrench, title: "Hidráulica", desc: "Reparos e instalações rápidas.", from: "R$ 150" },
  { icon: Zap, title: "Elétrica", desc: "Instalações e reparos com segurança.", from: "R$ 140" },
  { icon: Leaf, title: "Jardinagem", desc: "Manutenção do seu jardim.", from: "R$ 110" },
];

function Servicos() {
  return (
    <>
      <PageHeading
        title="Serviços"
        subtitle="Escolha o serviço ideal para o seu lar."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.title}
            className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2DD4BF]/10 text-[#0A1A2F]">
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#0A1A2F]">
              {s.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                A partir de{" "}
                <span className="font-semibold text-[#0A1A2F]">{s.from}</span>
              </span>
              <button className="inline-flex items-center gap-1 text-sm font-semibold text-[#2DD4BF] hover:text-[#14b8a6]">
                Agendar{" "}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
