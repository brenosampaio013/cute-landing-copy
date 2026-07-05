import { createFileRoute } from "@tanstack/react-router";
import { Star, ShieldCheck } from "lucide-react";
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
  { name: "Camila Rocha", role: "Limpeza Residencial", rating: 4.9, jobs: 312, avatar: "https://i.pravatar.cc/240?img=32" },
  { name: "Ana Beatriz", role: "Passadoria", rating: 4.8, jobs: 187, avatar: "https://i.pravatar.cc/240?img=45" },
  { name: "Marta Lopes", role: "Limpeza Pós-obra", rating: 5.0, jobs: 96, avatar: "https://i.pravatar.cc/240?img=48" },
  { name: "Rafael Duarte", role: "Hidráulica", rating: 4.9, jobs: 204, avatar: "https://i.pravatar.cc/240?img=12" },
];

function Profissionais() {
  return (
    <SitePage
      eyebrow="Equipe verificada"
      title="Nossos profissionais"
      subtitle="Equipe verificada, treinada e avaliada pelos nossos clientes."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pros.map((p) => (
          <div
            key={p.name}
            className="group flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative">
              <img
                src={p.avatar}
                alt={p.name}
                className="h-24 w-24 rounded-full object-cover ring-4 ring-[#2DD4BF]/15 transition group-hover:ring-[#2DD4BF]/30"
              />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100">
                <ShieldCheck className="h-4 w-4 text-[#2DD4BF]" />
              </span>
            </div>
            <h3 className="mt-5 text-base font-bold text-[#0A1A2F]">{p.name}</h3>
            <p className="text-sm text-slate-500">{p.role}</p>
            <div className="mt-4 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {p.rating.toFixed(1)}
              </span>
              <span className="text-slate-400">{p.jobs} serviços</span>
            </div>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
