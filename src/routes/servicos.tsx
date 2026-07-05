import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Sparkles, Shirt, Wrench, Clock, type LucideIcon } from "lucide-react";
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

const NAVY = "#0B1E3D";
const TEAL = "#1CA9B5";

type Service = {
  id: string;
  photo: string;
  icon: LucideIcon;
  title: string;
  desc: string;
};

const services: Service[] = [
  {
    id: "padrao",
    photo: photoPadrao,
    icon: Home,
    title: "LIMPEZA PADRÃO",
    desc: "Limpeza na medida certa para as necessidades do dia-a-dia.",
  },
  {
    id: "pesada",
    photo: photoPesada,
    icon: Sparkles,
    title: "LIMPEZA PESADA",
    desc: "Limpeza com tudo que seu lar precisa para ficar brilhando.",
  },
  {
    id: "passadoria",
    photo: photoPassadoria,
    icon: Shirt,
    title: "PASSADORIA",
    desc: "Suas roupas bem passadas, cuidadas e dobradas.",
  },
  {
    id: "montagem",
    photo: photoMontagem,
    icon: Wrench,
    title: "MONTAGEM DE MÓVEIS",
    desc: "Montadores qualificados para montar todo tipo de móvel.",
  },
];

function ServiceCard({ title, desc, photo, icon: Icon }: Service) {
  return (
    <article
      className="relative flex w-full max-w-sm mx-auto flex-col overflow-hidden rounded-3xl shadow-xl ring-1 ring-white/5 transition hover:-translate-y-1 hover:shadow-2xl"
      style={{ backgroundColor: NAVY }}
    >
      {/* Photo */}
      <div className="relative h-72 w-full overflow-hidden">
        <img
          src={photo}
          alt={`Funcionário da Maré Nobre realizando o serviço de ${title.toLowerCase()}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Top gradient for brand overlay */}
        <div
          className="absolute inset-x-0 top-0 h-20"
          style={{ background: "linear-gradient(to bottom, rgba(11,30,61,0.85), transparent)" }}
        />
        <div className="absolute top-4 left-0 right-0 flex flex-col items-center">
          <span className="font-serif text-lg tracking-wide text-white">MARÉ NOBRE</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-teal-200/90">
            Soluções para o seu lar
          </span>
        </div>

        {/* Bottom fade into card */}
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: `linear-gradient(to top, ${NAVY}, transparent)` }}
        />

        {/* Circular icon badge overlapping photo */}
        <div
          className="absolute -bottom-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-2"
          style={{ backgroundColor: NAVY, borderColor: TEAL }}
        >
          <Icon className="h-7 w-7" strokeWidth={1.75} style={{ color: TEAL }} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-12 text-center">
        <h3 className="text-xl font-bold uppercase tracking-wide text-white">{title}</h3>
        <p className="max-w-[240px] text-sm leading-relaxed text-slate-300">{desc}</p>

        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
          style={{ backgroundColor: "rgba(28,169,181,0.12)", color: TEAL }}
        >
          <Clock className="h-3.5 w-3.5" />
          Disponível para hoje
        </div>

        <Link
          to="/agendar"
          className="mt-1 w-full rounded-xl py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: TEAL }}
        >
          Agendar serviço
        </Link>
      </div>
    </article>
  );
}

function ServicosPage() {
  return (
    <SitePage
      eyebrow="O que oferecemos"
      title="Nossos serviços"
      subtitle="Profissionais qualificados prontos para cuidar do seu lar com o padrão Maré Nobre."
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <ServiceCard key={s.id} {...s} />
        ))}
      </div>
    </SitePage>
  );
}
