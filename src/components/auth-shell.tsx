import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Leaf } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import heroUrl from "@/assets/hero-cleaner.jpg";

export function AuthShell({ children }: { quote?: string; imageUrl?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/60 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr]">
        {/* Left panel */}
        <aside
          className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
          style={{
            background:
              "linear-gradient(160deg, #051329 0%, #0A1A2F 45%, #0B2B4E 100%)",
          }}
        >
          {/* Background photo */}
          <div className="pointer-events-none absolute inset-0">
            <img
              src={heroUrl}
              alt=""
              className="h-full w-full object-cover opacity-40"
              style={{
                maskImage:
                  "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, black 0%, black 60%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(5,19,41,0.55) 0%, rgba(10,26,47,0.75) 55%, rgba(11,43,78,0.95) 100%)",
              }}
            />
            {/* Decorative wave */}
            <svg
              className="absolute bottom-0 left-0 right-0 h-40 w-full text-[#2DD4BF]/25"
              viewBox="0 0 800 200"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 120 Q 200 60 400 120 T 800 120 L 800 200 L 0 200 Z"
                fill="currentColor"
                opacity="0.35"
              />
              <path
                d="M0 150 Q 200 100 400 150 T 800 150 L 800 200 L 0 200 Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="inline-block">
              <img src={logoUrl} alt="Maré Nobre" className="h-24 w-auto" />
            </Link>
          </div>

          {/* Tagline */}
          <div className="relative z-10 max-w-md">
            <h2
              className="text-4xl leading-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
            >
              Cuidado completo
              <br />
              para o{" "}
              <span className="relative inline-block text-[#2DD4BF]">
                seu lar.
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#2DD4BF]" />
              </span>
            </h2>

            <div className="mt-10 grid grid-cols-3 gap-4 text-center">
              {[
                { Icon: Sparkles, label: "Limpeza de qualidade" },
                { Icon: ShieldCheck, label: "Profissionais confiáveis" },
                { Icon: Leaf, label: "Soluções que transformam" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon className="h-7 w-7 text-[#2DD4BF]" strokeWidth={1.5} />
                  <p className="text-xs leading-snug text-white/80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <img src={logoUrl} alt="Maré Nobre" className="h-14 w-auto" />
          </div>
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:shadow-sm"
    >
      <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C41.5 35.7 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"
        />
      </svg>
      {label}
    </button>
  );
}
