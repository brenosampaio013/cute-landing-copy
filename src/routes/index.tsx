import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import {
  Calendar,
  CreditCard,
  UserCheck,
  Star,
  ArrowRight,
  Menu,
} from "lucide-react";
import heroCleaner from "@/assets/hero-cleaner.jpg";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";
import iconJardinagem from "@/assets/icon-jardinagem.png.asset.json";
import logo from "@/assets/logo.png";

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

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Serviços", href: "#servicos" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Profissionais", href: "#profissionais" },
  { label: "Avaliações", href: "#avaliacoes" },
  { label: "Contato", href: "#contato" },
];

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
        style={{
          background:
            "linear-gradient(160deg, #00132a 0%, #001a36 55%, #022543 100%)",
        }}
      >
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <a href="#inicio" className="flex shrink-0 items-center gap-2">
            <img src={logo} alt="Maré Nobre" className="h-16 w-auto sm:h-[70px]" />
          </a>
          <nav className="hidden flex-1 justify-center gap-5 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-white/85 transition hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 sm:inline-flex">
              Entrar
            </button>
            <button className="rounded-md bg-brand-teal-deep px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110">
              Cadastrar
            </button>
            <button className="lg:hidden" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-10 lg:grid-cols-2 lg:pb-28 lg:pt-16">
          <div className="max-w-xl">
            <h1
              className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
              style={{ fontFamily: 'var(--font-serif-bold)', fontWeight: 700 }}
            >
              Mais que limpeza.
              <br />
              Cuidado completo para o seu lar.
            </h1>
            <p className="mt-6 text-lg text-white/75">
              Profissionais qualificados, serviços de qualidade e a confiança que você merece.
            </p>
            <div className="mt-8">
              <button className="inline-flex items-center gap-2 rounded-full bg-[#2DD4BF] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-black/25 transition hover:brightness-110">
                Agendar agora <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold">4,9/5</span>
              <span className="text-white/70">Mais de 2.500 avaliações</span>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroCleaner}
              alt="Profissional de limpeza Maré Nobre"
              width={1024}
              height={1024}
              className="mx-auto h-auto w-full max-w-md object-cover lg:max-w-lg"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, black 12%, black 100%), linear-gradient(to top, transparent 0%, black 15%, black 100%)",
                WebkitMaskComposite: "source-in",
                maskImage:
                  "linear-gradient(to right, transparent 0%, black 12%, black 100%), linear-gradient(to top, transparent 0%, black 15%, black 100%)",
                maskComposite: "intersect",
              }}
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="bg-[#fafbfc] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2
              className="text-4xl font-bold text-brand-navy sm:text-5xl"
              style={{ fontFamily: 'var(--font-serif-bold)', fontWeight: 700 }}
            >
              Nossos serviços
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#2DD4BF]" />
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="group flex flex-col items-center rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200"
              >
                <div className="flex h-24 w-24 items-center justify-center">
                  <img
                    src={s.icon}
                    alt={s.title}
                    width={96}
                    height={96}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-6 text-lg font-bold text-brand-navy">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
                <a
                  href="#"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2DD4BF] hover:text-[#14b8a6]"
                >
                  Agendar
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />


      {/* Footer */}
      <footer id="contato" className="bg-brand-navy-deep py-10 text-center text-sm text-white/60">
        <p>© {new Date().getFullYear()} Maré Nobre — Soluções para o seu lar.</p>
      </footer>
    </div>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="como-funciona"
      className="py-28 text-white sm:py-32"
      style={{ backgroundColor: "oklch(0.17 0.045 250)" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2
            className="text-4xl font-bold sm:text-5xl"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Como funciona
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-[#2DD4BF]" />
        </div>
        <div ref={ref} className="relative mt-20 grid gap-14 md:grid-cols-4 md:gap-6">
          {/* Progress line */}
          <div
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-12 hidden h-[2px] overflow-hidden rounded-full bg-white/10 md:block"
            aria-hidden
          >
            <div
              className="h-full origin-left rounded-full transition-transform duration-[1600ms] ease-out"
              style={{
                background:
                  "linear-gradient(to right, rgba(45,212,191,0), #2DD4BF 40%, #2DD4BF 100%)",
                transform: visible ? "scaleX(1)" : "scaleX(0)",
              }}
            />
          </div>

          {steps.map((step, i) => (
            <div
              key={step.n}
              className="group relative flex flex-col items-center text-center"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 600ms ease-out ${i * 150}ms, transform 600ms ease-out ${i * 150}ms`,
              }}
            >
              <div className="relative">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background:
                      "linear-gradient(140deg, #2DD4BF 0%, #14b8a6 55%, #0d9488 100%)",
                    boxShadow:
                      "0 0 0 6px rgba(45,212,191,0.08), 0 10px 40px -8px rgba(45,212,191,0.55)",
                  }}
                >
                  <step.icon className="h-10 w-10 text-white" strokeWidth={2} />
                </div>
                <div className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#2DD4BF] text-sm font-bold text-white shadow-lg ring-4 ring-[color:oklch(0.17_0.045_250)]">
                  {step.n}
                </div>
              </div>
              <h3 className="mt-7 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 max-w-[220px] text-sm text-[#B0BEC5]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

