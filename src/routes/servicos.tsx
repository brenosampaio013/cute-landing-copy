import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Sparkles, Shirt, Wrench, Clock } from "lucide-react";
import { SitePage } from "@/components/site-page";
import photoPadrao from "@/assets/service-limpeza-padrao.jpg";
import photoPesada from "@/assets/service-limpeza-pesada.jpg";
import photoPassadoria from "@/assets/service-passadoria.jpg";
import photoMontagem from "@/assets/service-montagem.jpg";

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
    photo: photoPadrao,
    icon: Home,
    title: "LIMPEZA PADRÃO",
    desc: "Limpeza na medida certa para as necessidades do dia-a-dia.",
  },
  {
    photo: photoPesada,
    icon: Sparkles,
    title: "LIMPEZA PESADA",
    desc: "Limpeza com tudo que seu lar precisa para ficar brilhando.",
  },
  {
    photo: photoPassadoria,
    icon: Shirt,
    title: "PASSADORIA",
    desc: "Suas roupas bem passadas, cuidadas e dobradas.",
  },
  {
    photo: photoMontagem,
    icon: Wrench,
    title: "MONTAGEM DE MÓVEIS",
    desc: "Montadores qualificados para montar todo tipo de móvel.",
  },
];

function ServicosPage() {
  return (
    <SitePage
      eyebrow="O que oferecemos"
      title="Nossos serviços"
      subtitle="Profissionais qualificados prontos para cuidar do seu lar com o padrão Maré Nobre."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <article
              key={s.title}
              className="group flex flex-col overflow-hidden rounded-3xl bg-[#0A1A2F] text-white shadow-xl ring-1 ring-white/5 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Photo */}
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <img
                  src={s.photo}
                  alt={s.title}
                  width={768}
                  height={1024}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A1A2F]" />
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col items-center px-6 pb-6 -mt-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#2DD4BF] bg-[#0A1A2F]">
                  <Icon className="h-7 w-7 text-[#2DD4BF]" strokeWidth={1.75} />
                </div>

                <h3 className="mt-5 text-lg font-bold tracking-wide">{s.title}</h3>
                <span className="mt-2 block h-px w-10 bg-[#2DD4BF]/50" />

                <p className="mt-4 text-sm leading-relaxed text-slate-300">{s.desc}</p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-4 py-1.5 text-xs font-medium text-[#2DD4BF]">
                  <Clock className="h-3.5 w-3.5" />
                  Disponível para hoje
                </div>

                <Link
                  to="/agendar"
                  className="mt-6 w-full rounded-xl bg-[#2DD4BF] px-5 py-3 text-sm font-bold tracking-wide text-[#0A1A2F] transition hover:bg-[#26bfa9]"
                >
                  AGENDAR SERVIÇO
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </SitePage>
  );
}
