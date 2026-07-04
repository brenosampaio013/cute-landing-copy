import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
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
  { name: "Fernanda M.", text: "Serviço impecável, profissional pontual e muito atenciosa. Recomendo!", rating: 5 },
  { name: "Carlos A.", text: "Contratei limpeza pós-obra e ficou perfeito. Vou usar sempre.", rating: 5 },
  { name: "Patrícia L.", text: "Plataforma prática e preço justo. A Camila foi ótima!", rating: 5 },
  { name: "Rodrigo S.", text: "Rapidez no agendamento e ótimo atendimento. Nota 10.", rating: 4 },
];

function Avaliacoes() {
  return (
    <SitePage title="Avaliações" subtitle="Mais de 2.500 clientes já avaliaram nossos serviços — média 4,9/5.">
      <div className="grid gap-6 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.name} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-600">“{r.text}”</p>
            <p className="mt-4 text-sm font-semibold text-brand-navy">{r.name}</p>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
