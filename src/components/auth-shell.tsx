import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function AuthShell({
  quote,
  imageUrl,
  children,
}: {
  quote: string;
  imageUrl: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left panel */}
      <aside
        className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{
          background:
            "linear-gradient(160deg, #071A33 0%, #0A1A2F 50%, #0B2342 100%)",
        }}
      >
        <Link to="/" className="inline-flex items-center gap-2">
          <Leaf className="h-5 w-5 text-[#2DD4BF]" />
          <div>
            <div
              className="text-2xl leading-none tracking-wide text-white"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
            >
              MARÉ NOBRE
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.25em] text-white/60">
              Soluções para o seu lar
            </div>
          </div>
        </Link>

        <div className="relative z-10 max-w-md">
          <p
            className="text-4xl leading-tight text-white"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
          >
            {quote}
          </p>
          <div className="mt-6 h-[3px] w-16 rounded-full bg-[#2DD4BF]" />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover opacity-40"
            style={{
              maskImage:
                "radial-gradient(ellipse at center, black 40%, transparent 85%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 40%, transparent 85%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(7,26,51,0.85) 0%, rgba(10,26,47,0.75) 50%, rgba(11,35,66,0.85) 100%)",
            }}
          />
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Leaf className="h-5 w-5 text-[#2DD4BF]" />
          <span
            className="text-xl text-[#0A1A2F]"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
          >
            MARÉ NOBRE
          </span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

export function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
