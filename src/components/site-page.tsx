import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";

export function SitePage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <section
        className="text-white"
        style={{
          background: "linear-gradient(160deg, #00132a 0%, #001a36 55%, #022543 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
          <h1
            className="text-4xl sm:text-5xl"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-2xl text-white/70">{subtitle}</p>
          )}
          <div className="mx-auto mt-6 h-[3px] w-16 rounded-full bg-[#2DD4BF]" />
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-6 py-16">{children}</main>
      <footer className="bg-brand-navy-deep py-10 text-center text-sm text-white/60">
        <p>© {new Date().getFullYear()} Maré Nobre — Soluções para o seu lar.</p>
      </footer>
    </div>
  );
}
