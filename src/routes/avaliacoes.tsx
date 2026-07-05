import { createFileRoute } from "@tanstack/react-router";
import { Star, Quote } from "lucide-react";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Avaliações — Maré Nobre" },
      { name: "description", content: "Veja o que os clientes falam sobre a Maré Nobre." },
    ],
  }),
  component: Avaliacoes,
});

const reviews = [
  { name: "Fernanda M.", role: "São Paulo, SP", text: "Serviço impecável, profissional pontual e muito atenciosa. Recomendo!", rating: 5 },
  { name: "Carlos A.", role: "Rio de Janeiro, RJ", text: "Contratei limpeza pós-obra e ficou perfeito. Vou usar sempre.", rating: 5 },
  { name: "Patrícia L.", role: "Campinas, SP", text: "Plataforma prática e preço justo. A Camila foi ótima!", rating: 5 },
  { name: "Rodrigo S.", role: "Curitiba, PR", text: "Rapidez no agendamento e ótimo atendimento. Nota 10.", rating: 4 },
];

const stats = [
  { value: "4,9/5", label: "Nota média" },
  { value: "2.500+", label: "Avaliações" },
  { value: "98%", label: "Recomendam" },
];

function Avaliacoes() {
  return (
    <SitePage
      eyebrow="Quem já contratou aprovou"
      title="Avaliações"
      subtitle="Mais de 2.500 clientes já avaliaram nossos serviços."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm"
          >
            <p
              className="text-3xl text-[#0A1A2F]"
              style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
            >
              {s.value}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {reviews.map((r) => (
          <div
            key={r.name}
            className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <Quote className="absolute right-6 top-6 h-10 w-10 text-[#2DD4BF]/10" aria-hidden />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">"{r.text}"</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2DD4BF]/15 text-sm font-bold text-[#0A9E8A]">
                {r.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0A1A2F]">{r.name}</p>
                <p className="text-xs text-slate-400">{r.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
