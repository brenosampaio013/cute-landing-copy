import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Sparkles, Shirt, Waves, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { SitePage } from "@/components/site-page";
import fotoPosObra from "@/assets/service-pos-obra.jpg";
import fotoPassadoria from "@/assets/service-passadoria.jpg";
import fotoLimpezaPiscina from "@/assets/service-limpeza-piscina.jpg";

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

function IconBroom() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
      <path d="M30 6 L18 34" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 34 L10 42 M18 34 L22 41 M18 34 L14 41" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="34" cy="10" r="1.6" fill={TEAL} />
      <circle cx="39" cy="15" r="1.2" fill={TEAL} />
      <circle cx="36" cy="18" r="1" fill={TEAL} />
    </svg>
  );
}

function IconIron() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
      <path
        d="M8 30 h24 c4 0 8-4 8-9 0-4-3-7-7-8l-7-2H14c-3 0-6 3-6 6z"
        stroke={TEAL}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <line x1="6" y1="34" x2="34" y2="34" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="30" cy="15" r="1.4" fill={TEAL} />
    </svg>
  );
}

function IconPool() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
      <path
        d="M6 30c3 3 6-3 9 0s6-3 9 0 6-3 9 0 6-3 9 0"
        stroke={TEAL}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M34 8v14 M34 8h6 M34 14h6" stroke={TEAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Service = {
  id: string;
  title: string;
  desc: string;
  photo: string;
  Icon: ComponentType;
};

const services: Service[] = [
  {
    id: "pos-obra",
    title: "PÓS OBRA",
    desc: "Removemos toda a sujeira e resíduos da obra, deixando tudo pronto para você.",
    photo: fotoPosObra,
    Icon: IconBroom,
  },
  {
    id: "passadoria",
    title: "PASSADORIA",
    desc: "Suas roupas bem passadas, cuidadas e dobradas.",
    photo: fotoPassadoria,
    Icon: IconIron,
  },
  {
    id: "limpeza-piscina",
    title: "LIMPEZA DE PISCINA",
    desc: "Água limpa, cristalina e sempre pronta para você aproveitar.",
    photo: fotoLimpezaPiscina,
    Icon: IconPool,
  },
];

function ServiceCard({ title, desc, photo, Icon }: Service) {
  return (
    <article
      className="relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-xl ring-1 ring-white/5 transition hover:-translate-y-1 hover:shadow-2xl"
      style={{ backgroundColor: NAVY }}
    >
      <div className="relative h-80 w-full overflow-hidden">
        <img
          src={photo}
          alt={`Funcionário da Maré Nobre realizando o serviço de ${title.toLowerCase()}`}
          width={768}
          height={1024}
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {/* Top brand overlay */}
        <div
          className="absolute inset-x-0 top-0 h-24"
          style={{ background: "linear-gradient(to bottom, rgba(11,30,61,0.9), transparent)" }}
        />
        <div className="absolute inset-x-0 top-4 flex flex-col items-center">
          <span className="font-serif text-lg tracking-[0.15em] text-white">MARÉ NOBRE</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-teal-200/90">
            Soluções para o seu lar
          </span>
        </div>

        {/* Bottom fade into card */}
        <div
          className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: `linear-gradient(to top, ${NAVY}, transparent)` }}
        />

        {/* Circular icon badge */}
        <div
          className="absolute -bottom-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-2"
          style={{ backgroundColor: NAVY, borderColor: TEAL }}
        >
          <Icon />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-12 text-center">
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
      <div className="grid gap-8 md:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} {...s} />
        ))}
      </div>
    </SitePage>
  );
}
