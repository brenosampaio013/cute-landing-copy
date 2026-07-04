import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, Home, Shirt, Sparkles, Plus } from "lucide-react";
import { PageHeading } from "./dashboard";

export const Route = createFileRoute("/dashboard/agendamentos")({
  head: () => ({ meta: [{ title: "Agendamentos — Maré Nobre" }] }),
  component: Agendamentos,
});

const items = [
  {
    icon: Home,
    title: "Limpeza Residencial",
    date: "12 Jul 2026",
    time: "09:00 — 12:00",
    pro: "Camila Rocha",
    status: "Confirmado",
    tone: "bg-sky-100 text-sky-700",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    icon: Shirt,
    title: "Passadoria",
    date: "20 Jul 2026",
    time: "14:00 — 16:00",
    pro: "Ana Beatriz",
    status: "Agendado",
    tone: "bg-amber-100 text-amber-700",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    icon: Sparkles,
    title: "Limpeza Pós-obra",
    date: "05 Ago 2026",
    time: "08:00 — 13:00",
    pro: "Marta Lopes",
    status: "Aguardando",
    tone: "bg-emerald-100 text-emerald-700",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
];

function Agendamentos() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          title="Agendamentos"
          subtitle="Acompanhe os serviços agendados e o histórico."
        />
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#2DD4BF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
          <Plus className="h-4 w-4" /> Novo agendamento
        </button>
      </div>

      <div className="grid gap-4">
        {items.map((it) => (
          <div
            key={it.title + it.date}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${it.tone}`}
              >
                <it.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0A1A2F]">
                  {it.title}
                </p>
                <p className="text-xs text-slate-500">
                  Profissional: {it.pro}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#2DD4BF]" /> {it.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#2DD4BF]" /> {it.time}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${it.badge}`}
              >
                {it.status}
              </span>
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#0A1A2F] hover:bg-slate-50">
                Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
