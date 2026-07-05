import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Sparkles, Shirt, Wrench, ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";

export const Route = createFileRoute("/dashboard/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Maré Nobre" }] }),
  component: Servicos,
});

const services = [
  { slug: "limpeza-padrao", icon: Home, title: "Limpeza Padrão", desc: "Limpeza na medida certa para o dia a dia.", from: "R$ 120" },
  { slug: "limpeza-pesada", icon: Sparkles, title: "Limpeza Pesada", desc: "Limpeza completa para o seu lar brilhar.", from: "R$ 220" },
  { slug: "passadoria", icon: Shirt, title: "Passadoria", desc: "Suas roupas bem passadas, cuidadas e dobradas.", from: "R$ 90" },
  { slug: "montagem-moveis", icon: Wrench, title: "Montagem de Móveis", desc: "Montadores qualificados para todo tipo de móvel.", from: "R$ 150" },
];

function Servicos() {
  return (
    <>
      <PageHeading title="Serviços" subtitle="Escolha o serviço ideal para o seu lar." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.slug}
            className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2DD4BF]/10 text-[#0A1A2F]">
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#0A1A2F]">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                A partir de <span className="font-semibold text-[#0A1A2F]">{s.from}</span>
              </span>
              <Link
                to="/agendar"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#2DD4BF] hover:text-[#14b8a6]"
              >
                Agendar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
