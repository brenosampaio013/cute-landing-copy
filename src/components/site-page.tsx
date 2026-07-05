import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf, Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import { SiteHeader } from "./site-header";

export function SitePage({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <SiteHeader />
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Decorative glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #2DD4BF 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          {eyebrow && (
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2DD4BF] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />
              {eyebrow}
            </span>
          )}
          <h1
            className="max-w-3xl text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              {subtitle}
            </p>
          )}
          <div className="mt-8 h-[3px] w-16 rounded-full bg-[#2DD4BF]" />
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-6 py-16 sm:py-20">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  const cols: { title: string; links: { label: string; to: string }[] }[] = [
    {
      title: "Serviços",
      links: [
        { label: "Limpeza Residencial", to: "/servicos" },
        { label: "Pós-obra", to: "/servicos" },
        { label: "Limpeza de Vidros", to: "/servicos" },
        { label: "Limpeza de Piscinas", to: "/servicos" },
        { label: "Jardinagem", to: "/servicos" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { label: "Como funciona", to: "/como-funciona" },
        { label: "Profissionais", to: "/profissionais" },
        { label: "Avaliações", to: "/avaliacoes" },
        { label: "Contato", to: "/contato" },
      ],
    },
  ];

  return (
    <footer className="text-white/70" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white">
              <Leaf className="h-5 w-5 text-[#2DD4BF]" />
              <span
                className="text-2xl"
                style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
              >
                MARÉ NOBRE
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Cuidados premium para o seu lar. Profissionais verificados, agendamento
              simples e a confiança que você merece.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/marenobreservicos/", label: "Instagram" },
                { Icon: Facebook, href: "#", label: "Facebook" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-[#2DD4BF] hover:text-[#2DD4BF]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-white/70 transition hover:text-[#2DD4BF]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Maré Nobre — Soluções para o seu lar.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> atendimentomarenobre@gmail.com
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> (13) 99806-8265
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Bertioga, SP
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
