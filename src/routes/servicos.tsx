import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Sparkles, Shirt, Waves, type LucideIcon } from "lucide-react";

import { SitePage } from "@/components/site-page";
import fotoPosObra from "@/assets/service-pos-obra-clean.jpg";
import fotoPassadoria from "@/assets/service-passadoria-clean.jpg";
import fotoLimpezaPiscina from "@/assets/service-limpeza-piscina-clean.jpg";

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
  title: string;
  desc: string;
  photo: string;
  Icon: LucideIcon;
};

const services: Service[] = [
  {
    id: "pos-obra",
    title: "PÓS OBRA",
    desc: "Removemos toda a sujeira e resíduos da obra, deixando tudo pronto para você.",
    photo: fotoPosObraAsset.url,
    Icon: Sparkles,
  },
  {
    id: "passadoria",
    title: "PASSADORIA",
    desc: "Suas roupas bem passadas, cuidadas e dobradas.",
    photo: fotoPassadoriaAsset.url,
    Icon: Shirt,
  },
  {
    id: "limpeza-piscina",
    title: "LIMPEZA DE PISCINA",
    desc: "Água limpa, cristalina e sempre pronta para você aproveitar.",
    photo: fotoLimpezaPiscinaAsset.url,
    Icon: Waves,
  },
];

function ServiceCard({ title, desc, photo, Icon }: Service) {
  return (
    <article
      className="group relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-xl ring-1 ring-white/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-[#2DD4BF]/30"
      style={{ backgroundColor: NAVY }}
    >
      <div className="hover-zoom relative h-[21rem] w-full">
        <img
          src={photo}
          alt={`Funcionário da Maré Nobre realizando o serviço de ${title.toLowerCase()}`}
          width={768}
          height={972}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{ background: `linear-gradient(to top, ${NAVY}, transparent)` }}
        />
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-0 text-center">
        <div
          className="relative z-10 -mt-8 flex h-16 w-16 items-center justify-center rounded-full border-2 transition group-hover:scale-105"
          style={{ backgroundColor: NAVY, borderColor: TEAL }}
        >
          <Icon className="h-7 w-7" strokeWidth={1.75} style={{ color: TEAL }} />
        </div>
        <h3 className="text-xl font-bold uppercase tracking-wide text-white">{title}</h3>
        <p className="max-w-[260px] text-sm leading-relaxed text-slate-300">{desc}</p>

        <div
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium"
          style={{ backgroundColor: "rgba(28,169,181,0.12)", color: TEAL }}
        >
          <Clock className="h-3.5 w-3.5" />
          Disponível para hoje
        </div>

        <Link
          to="/agendar"
          aria-label={`Agendar serviço de ${title.toLowerCase()}`}
          className="mt-1 inline-flex w-full items-center justify-center rounded-full py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110 active:scale-[0.98]"
          style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
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
      <div className="grid gap-8 md:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} {...s} />
        ))}
      </div>
    </SitePage>
  );
}
