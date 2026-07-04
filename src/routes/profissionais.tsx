import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/profissionais")({
  head: () => ({
    meta: [
      { title: "Profissionais — Maré Nobre" },
      { name: "description", content: "Conheça os profissionais qualificados da Maré Nobre." },
    ],
  }),
  component: Profissionais,
});

const pros = [
  { name: "Camila Rocha", role: "Limpeza Residencial", rating: 4.9, avatar: "https://i.pravatar.cc/160?img=32" },
  { name: "Ana Beatriz", role: "Passadoria", rating: 4.8, avatar: "https://i.pravatar.cc/160?img=45" },
  { name: "Marta Lopes", role: "Limpeza Pós-obra", rating: 5.0, avatar: "https://i.pravatar.cc/160?img=48" },
  { name: "Rafael Duarte", role: "Hidráulica", rating: 4.9, avatar: "https://i.pravatar.cc/160?img=12" },
];

function Profissionais() {
  return (
    <SitePage title="Nossos profissionais" subtitle="Equipe verificada, treinada e avaliada pelos nossos clientes.">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pros.map((p) => (
          <div key={p.name} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            <img src={p.avatar} alt={p.name} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#2DD4BF]/20" />
            <h3 className="mt-4 text-base font-bold text-brand-navy">{p.name}</h3>
            <p className="text-sm text-slate-500">{p.role}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
