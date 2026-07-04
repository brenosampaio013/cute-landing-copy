import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SitePage } from "@/components/site-page";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";
import iconJardinagem from "@/assets/icon-jardinagem.png.asset.json";

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
  { icon: iconLimpeza.url, title: "Limpeza Residencial", desc: "Ambientes sempre limpos e aconchegantes." },
  { icon: iconPosObra.url, title: "Limpeza Pós-obra", desc: "Deixamos tudo pronto para você aproveitar." },
  { icon: iconPassadoria.url, title: "Passadoria", desc: "Suas roupas cuidadas com todo carinho." },
  { icon: iconJardinagem.url, title: "Jardinagem", desc: "Seu jardim sempre bonito e saudável." },
];

function ServicosPage() {
  return (
    <SitePage
      title="Nossos serviços"
      subtitle="Profissionais qualificados prontos para cuidar do seu lar com o padrão Maré Nobre."
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <div
            key={s.title}
            className="group flex flex-col items-center rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200"
          >
            <div className="flex h-24 w-24 items-center justify-center">
              <img src={s.icon} alt={s.title} width={96} height={96} loading="lazy" className="h-full w-full object-contain" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-brand-navy">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
            <a href="#" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2DD4BF] hover:text-[#14b8a6]">
              Agendar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
