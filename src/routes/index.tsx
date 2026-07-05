import { createFileRoute, Link } from "@tanstack/react-router";

import {
  Calendar,
  CreditCard,
  UserCheck,
  Star,
  ArrowRight,
} from "lucide-react";
import heroCleaner from "@/assets/mare-nobre-hero.png.asset.json";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";
import iconJardinagem from "@/assets/icon-jardinagem.png.asset.json";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maré Nobre — Soluções para o seu lar" },
      {
        name: "description",
        content:
          "Cuidados premium para o seu lar. Profissionais qualificados em limpeza, passadoria, hidráulica, elétrica e jardinagem.",
      },
      { property: "og:title", content: "Maré Nobre — Soluções para o seu lar" },
      {
        property: "og:description",
        content:
          "Cuidados premium para o seu lar. Profissionais qualificados em limpeza, hidráulica, elétrica e jardinagem.",
      },
    ],
  }),
  component: Index,
});


const services = [
  { icon: iconLimpeza.url, title: "Limpeza Residencial", desc: "Ambientes sempre limpos e aconchegantes." },
  { icon: iconPosObra.url, title: "Limpeza Pós-obra", desc: "Deixamos tudo pronto para você aproveitar." },
  { icon: iconPassadoria.url, title: "Passadoria", desc: "Suas roupas cuidadas com todo carinho." },
  { icon: iconJardinagem.url, title: "Jardinagem", desc: "Seu jardim sempre bonito e saudável." },
];

const steps = [
  { n: 1, icon: Calendar, title: "Escolha o serviço", desc: "Selecione o serviço que você precisa." },
  { n: 2, icon: Calendar, title: "Escolha data e horário", desc: "Agende o melhor dia e horário para você." },
  { n: 3, icon: CreditCard, title: "Pagamento seguro", desc: "Pague com segurança na plataforma." },
  { n: 4, icon: UserCheck, title: "Profissional confirmado", desc: "Pronto! Seu profissional está a caminho." },
];

function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero + Nav */}
      <section
        id="inicio"
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Decorative glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #2DD4BF 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
        />
        <SiteHeader transparent />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-24 pt-28 lg:grid-cols-2 lg:pb-32 lg:pt-32">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2DD4BF] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />
              Cuidado premium para o seu lar
            </span>
            <h1
              className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-serif-bold)', fontWeight: 700 }}
            >
              Mais que limpeza.
              <br />
              Cuidado completo para o seu lar.
            </h1>
            <p className="mt-6 text-base text-white/75 sm:text-lg">
              Profissionais qualificados, serviços de qualidade e a confiança que você merece.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
              <Link
                to="/agendar"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-teal)" }}
              >
                Agendar agora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/como-funciona"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/25 px-8 text-base font-medium text-white/90 transition hover:border-white/60 hover:bg-white/10"
              >
                Como funciona
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm lg:justify-start">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold">4,9/5</span>
              <span className="text-white/70">Mais de 2.500 avaliações</span>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <img
              src={heroCleaner.url}
              alt="Profissional Maré Nobre com kit de limpeza"
              width={1440}
              height={1080}
              className="h-auto w-full max-w-sm rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 sm:max-w-md lg:max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="bg-[#F7F8FA] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0A9E8A]">
              O que oferecemos
            </span>
            <h2
              className="mt-4 text-4xl text-[#0A1A2F] sm:text-5xl"
              style={{ fontFamily: 'var(--font-serif-bold)', fontWeight: 700 }}
            >
              Nossos serviços
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
              Uma equipe cuidadosa e verificada, pronta para cuidar de cada canto do seu lar.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Link
                key={s.title}
                to="/agendar"
                className="group flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2DD4BF]/40 hover:shadow-2xl hover:shadow-slate-200/70"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2DD4BF]/5 transition group-hover:bg-[#2DD4BF]/10">
                  <img
                    src={s.icon}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                    className="h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <h3 className="mt-6 text-lg font-bold text-[#0A1A2F]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2DD4BF] transition group-hover:text-[#0A9E8A]">
                  Agendar
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      <SiteFooter />
    </div>
  );
}

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="py-28 text-white sm:py-32"
      style={{
        background: "linear-gradient(160deg, #071A33 0%, #0B2342 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2
            className="text-4xl font-bold text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Como funciona
          </h2>
          <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-[#19C6C5]" />
        </div>

        <div className="relative mt-20">
          {/* Connector line — centered on the 74px circles (top-1/2 within a 74px block = 37px) */}
          <div
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] hidden h-[2px] bg-[#0F6D8C] md:block"
            style={{ top: "36px" }}
            aria-hidden
          />

          <div className="relative grid gap-14 md:grid-cols-4 md:gap-8">
            {steps.map((step) => (
              <div
                key={step.n}
                className="flex flex-col items-center text-center"
              >
                <div
                  className="flex items-center justify-center rounded-full border border-white/10 bg-[#19C6C5]"
                  style={{ width: 74, height: 74 }}
                >
                  <step.icon
                    className="h-8 w-8 text-white"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="mt-8 text-base font-semibold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[210px] text-sm leading-relaxed text-white/70">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


