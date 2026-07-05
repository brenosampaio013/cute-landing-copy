import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import loginBg from "@/assets/login-bg.png.asset.json";
import logoUrl from "@/assets/logo.png";

export function AuthShell({ children }: { quote?: string; imageUrl?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 p-0 sm:p-4 lg:p-8">
      <div className="mx-auto grid min-h-screen max-w-7xl overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200/60 sm:min-h-[calc(100vh-2rem)] sm:rounded-3xl lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel — full artwork background */}
        <aside className="relative hidden overflow-hidden bg-[#0A1A2F] lg:block">
          <Link to="/" className="absolute inset-0 z-10" aria-label="Ir para a página inicial">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url(${loginBg.url})`,
                backgroundSize: "200% 100%",
                backgroundPosition: "left center",
                backgroundRepeat: "no-repeat",
              }}
            />
          </Link>
        </aside>


        {/* Mobile compact header */}
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden bg-[#0A1A2F] px-6 py-8 lg:hidden"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(5,19,41,0.55) 0%, rgba(10,26,47,0.85) 100%), url(${loginBg.url})`,
            backgroundSize: "200% auto",
            backgroundPosition: "left center",
          }}
        >
          <Link to="/" className="inline-block">
            <img src={logoUrl} alt="Maré Nobre" className="h-16 w-auto sm:h-20" />
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
