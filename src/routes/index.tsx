import { createFileRoute } from "@tanstack/react-router";
import {
  Home,
  Sparkles,
  Shirt,
  Wrench,
  Zap,
  Leaf,
  Calendar,
  CreditCard,
  UserCheck,
  Star,
  ArrowRight,
  Menu,
} from "lucide-react";
import heroCleaner from "@/assets/hero-cleaner.jpg";
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
  { icon: Home, title: "Limpeza Residencial", desc: "Ambientes sempre limpos e aconchegantes." },
  { icon: Sparkles, title: "Limpeza Pós-obra", desc: "Deixamos tudo pronto para você aproveitar." },
  { icon: Shirt, title: "Passadoria", desc: "Suas roupas cuidadas com todo carinho." },
  { icon: Wrench, title: "Hidráulica", desc: "Soluções rápidas e eficientes." },
  { icon: Zap, title: "Elétrica", desc: "Instalações e reparos com segurança." },
  { icon: Leaf, title: "Jardinagem", desc: "Seu jardim sempre bonito e saudável." },
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
            "linear-gradient(135deg, oklch(0.17 0.045 250) 0%, oklch(0.22 0.05 250) 100%)",
        }}
      >
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <a href="#inicio" className="flex shrink-0 items-center gap-2">
            <img src={logo} alt="Maré Nobre" className="h-12 w-auto rounded" />
          </a>
          <nav className="hidden items-center gap-7 lg:flex">
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
            <h1 className="font-display text-6xl leading-[1.02] tracking-tight sm:text-7xl">
              Cuidados premium
              <br />
              para o seu lar.
            </h1>
            <p className="mt-6 text-lg text-white/75">
              Profissionais qualificados, serviços de qualidade e a confiança que você merece.
            </p>
            <div className="mt-8">
              <button className="inline-flex items-center gap-2 rounded-md bg-brand-teal-deep px-6 py-3 text-base font-semibold text-white shadow-xl shadow-black/30 transition hover:brightness-110">
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
              className="mx-auto h-auto w-full max-w-md rounded-2xl object-cover shadow-2xl shadow-black/40 lg:max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-navy sm:text-4xl">Nossos serviços</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand-teal" />
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-brand-teal-deep ring-1 ring-slate-100">
                  <s.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-base font-bold text-brand-navy">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
                <a
                  href="#"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-teal-deep hover:underline"
                >
                  Agendar <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="como-funciona"
        className="py-20 text-white"
        style={{ backgroundColor: "oklch(0.17 0.045 250)" }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Como funciona</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand-teal" />
          </div>
          <div className="relative mt-14 grid gap-10 md:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.n} className="relative flex flex-col items-center text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-[60%] right-[-40%] top-10 hidden border-t-2 border-dashed border-white/25 md:block" />
                )}
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-brand-navy-deep">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal-deep text-sm font-bold text-white shadow-md">
                    {step.n}
                  </div>
                </div>
                <h3 className="mt-5 text-base font-bold">{step.title}</h3>
                <p className="mt-2 max-w-[200px] text-sm text-white/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-brand-navy-deep py-10 text-center text-sm text-white/60">
        <p>© {new Date().getFullYear()} Maré Nobre — Soluções para o seu lar.</p>
      </footer>
    </div>
  );
}
