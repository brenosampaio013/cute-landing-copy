import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Leaf } from "lucide-react";
import logoAsset from "@/assets/mare-nobre-logo-v2.png.asset.json";

export function AuthShell({ children }: { quote?: string; imageUrl?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 p-0 sm:p-4 lg:p-8">
      <div className="mx-auto grid min-h-screen max-w-7xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200/60 sm:min-h-[calc(100vh-2rem)] sm:rounded-3xl lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside
          className="relative hidden overflow-hidden lg:block"
          style={{
            background:
              "radial-gradient(120% 80% at 20% 10%, #12406B 0%, #0A1A2F 55%, #05101F 100%)",
          }}
        >
          <div className="relative z-10 flex h-full flex-col justify-between px-10 py-12 xl:px-14">
            <Link to="/" aria-label="Ir para a página inicial" className="inline-block self-center">
              <img
                src={logoAsset.url}
                alt="Maré Nobre"
                className="mx-auto h-auto w-full max-w-[300px] xl:max-w-[340px]"
              />
            </Link>

            <div className="space-y-8">
              <div>
                <h2
                  className="text-3xl leading-tight text-white xl:text-4xl"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
                >
                  Encontre os melhores profissionais para o{" "}
                  <span className="text-[#2DD4BF]">seu lar</span>.
                </h2>
                <div className="mt-4 h-0.5 w-16 rounded-full bg-[#2DD4BF]" />
              </div>

              <ul className="space-y-5">
                {[
                  { Icon: Sparkles, title: "Limpeza de qualidade", desc: "Ambientes sempre limpos e organizados." },
                  { Icon: ShieldCheck, title: "Profissionais confiáveis", desc: "Profissionais verificados e qualificados." },
                  { Icon: Leaf, title: "Soluções que transformam", desc: "Mais praticidade e bem-estar para o seu dia a dia." },
                ].map(({ Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/5 ring-1 ring-[#2DD4BF]/40">
                      <Icon className="h-5 w-5 text-[#2DD4BF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-sm text-white/60">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-3 border-t border-white/10 pt-6 text-white/60">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[#2DD4BF]" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-white/85">Seus dados estão protegidos</p>
                <p>Não compartilhamos suas informações com terceiros.</p>
              </div>
            </div>
          </div>

          {/* subtle wave decoration */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-40"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 100%, rgba(45,212,191,0.35) 0%, transparent 70%)",
            }}
          />
        </aside>

        {/* Mobile compact header */}
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-8 lg:hidden"
          style={{
            background:
              "radial-gradient(120% 80% at 20% 10%, #12406B 0%, #0A1A2F 55%, #05101F 100%)",
          }}
        >
          <Link to="/" className="inline-block">
            <img src={logoAsset.url} alt="Maré Nobre" className="h-16 w-auto sm:h-20" />
          </Link>
        </div>

        {/* Form panel */}
        <main className="flex flex-col items-center justify-center bg-white px-5 py-8 sm:px-10 sm:py-12">
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
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C41.5 35.7 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {label}
    </button>
  );
}
