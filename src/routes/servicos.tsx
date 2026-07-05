import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SitePage } from "@/components/site-page";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";
import iconMontagem from "@/assets/icon-montagem.png";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Nossos serviços — Maré Nobre" },
      { name: "description", content: "Conheça os serviços da Maré Nobre para o seu lar." },
    ],
  }),
  component: ServicosPage,
});

const services = [
  {
    icon: iconLimpeza.url,
    title: "Limpeza Padrão",
    desc: "Limpeza na medida certa para as necessidades do dia a dia.",
    features: ["Cozinha, banheiros e áreas comuns", "Produtos inclusos", "Profissionais treinados"],
  },
  {
    icon: iconPosObra.url,
    title: "Limpeza Pesada",
    desc: "Limpeza com tudo que seu lar precisa para ficar brilhando.",
    features: ["Detalhamento completo", "Vidros e pisos", "Equipe especializada"],
  },
  {
    icon: iconPassadoria.url,
    title: "Passadoria",
    desc: "Suas roupas bem passadas, cuidadas e dobradas.",
    features: ["Passar e dobrar", "Peças delicadas", "Entrega organizada"],
  },
  {
    icon: iconMontagem,
    title: "Montagem de Móveis",
    desc: "Montadores qualificados para montar todo tipo de móvel.",
    features: ["Guarda-roupas e camas", "Ferramentas próprias", "Serviço ágil"],
  },
];

function ServicosPage() {
  return (
    <SitePage
      eyebrow="O que oferecemos"
      title="Nossos serviços"
      subtitle="Profissionais qualificados prontos para cuidar do seu lar com o padrão Maré Nobre."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {services.map((s) => (
          <div
            key={s.title}
            className="group flex flex-col rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#2DD4BF]/40 hover:shadow-2xl hover:shadow-slate-200/70"
          >
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#2DD4BF]/10">
                <img src={s.icon} alt="" width={56} height={56} loading="lazy" className="h-12 w-12 object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-[#0A1A2F]">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            </div>
            <ul className="mt-6 space-y-2.5">
              {s.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/agendar"
              className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[#2DD4BF] transition hover:text-[#0A9E8A]"
            >
              Agendar este serviço
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
