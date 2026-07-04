import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Home,
  Sparkles,
  Shirt,
  Star,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [{ title: "Dashboard — Maré Nobre" }],
  }),
  component: DashboardHome,
});

const bookings = [
  {
    icon: Home,
    title: "Limpeza Residencial",
    when: "12 Jul 2026 · 09:00",
    rating: 5,
    tone: "bg-sky-100 text-sky-700",
  },
  {
    icon: Shirt,
    title: "Passadoria",
    when: "05 Jul 2026 · 14:00",
    rating: 4,
    tone: "bg-amber-100 text-amber-700",
  },
  {
    icon: Sparkles,
    title: "Limpeza Pós-obra",
    when: "22 Jun 2026 · 10:30",
    rating: 5,
    tone: "bg-emerald-100 text-emerald-700",
  },
];

function DashboardHome() {
  const [rating, setRating] = useState(0);

  return (
    <>
      <h1
        className="text-3xl text-[#0A1A2F] sm:text-4xl"
        style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
      >
        Dashboard
      </h1>

      {/* Greeting */}
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-xl font-bold text-[#0A1A2F] sm:text-2xl">
          Olá, Juliana! 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">Que bom ter você aqui.</p>
      </section>

      {/* Row 1 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
          <h3
            className="text-lg text-[#0A1A2F]"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Próximo agendamento
          </h3>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <Home className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#0A1A2F]">
                  Limpeza Residencial
                </p>
                <p className="text-xs text-slate-500">Apto 2 · 90m²</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Confirmado
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#2DD4BF]" />
              12 Jul 2026
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2DD4BF]" />
              09:00 — 12:00
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <img
                src="https://i.pravatar.cc/80?img=32"
                alt="Profissional"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="text-sm">
                <p className="text-slate-500">Profissional</p>
                <p className="font-semibold text-[#0A1A2F]">Camila Rocha</p>
              </div>
            </div>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A1A2F] transition hover:bg-slate-50">
              Ver detalhes
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Status do pagamento
              </p>
              <p className="text-lg font-bold text-[#0A1A2F]">Pago</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Pagamento realizado em{" "}
            <span className="font-medium text-slate-700">10 Jul 2026</span> às{" "}
            <span className="font-medium text-slate-700">18:42</span>.
          </p>
          <button className="mt-6 w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-[#0A1A2F] transition hover:bg-slate-200">
            Ver recibo
          </button>
        </section>
      </div>

      {/* Row 2 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg text-[#0A1A2F]"
              style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
            >
              Meus agendamentos
            </h3>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#2DD4BF] hover:text-[#14b8a6]"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <ul className="mt-5 divide-y divide-slate-100">
            {bookings.map((b) => (
              <li
                key={b.title}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${b.tone}`}
                  >
                    <b.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A1A2F]">
                      {b.title}
                    </p>
                    <p className="text-xs text-slate-500">{b.when}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Concluído
                  </span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < b.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3
            className="text-lg text-[#0A1A2F]"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Avalie seu último serviço
          </h3>

          <div className="mt-5 flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/80?img=32"
              alt="Profissional"
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-[#0A1A2F]">
                Camila Rocha
              </p>
              <p className="text-xs text-slate-500">
                Limpeza Residencial · 22 Jun 2026
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < rating;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Dar ${i + 1} estrela${i ? "s" : ""}`}
                  onClick={() => setRating(i + 1)}
                  className="transition hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      filled ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <button className="mt-6 w-full rounded-lg bg-[#0A1A2F] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-125">
            Avaliar
          </button>
        </section>
      </div>
    </>
  );
}
