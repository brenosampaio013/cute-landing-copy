import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site-page";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";
import iconJardinagem from "@/assets/icon-jardinagem.png.asset.json";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar serviço — Maré Nobre" }] }),
  component: Agendar,
});

const services = [
  { icon: iconLimpeza.url, title: "Limpeza Residencial" },
  { icon: iconPosObra.url, title: "Limpeza Pós-obra" },
  { icon: iconPassadoria.url, title: "Passadoria" },
  { icon: iconJardinagem.url, title: "Jardinagem" },
];

function Agendar() {
  return (
    <SitePage title="Agendar serviço" subtitle="Escolha o serviço, a data e o horário. Confirmação em minutos.">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">1. Escolha o serviço</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {services.map((s) => (
              <button key={s.title} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-[#2DD4BF] hover:shadow-md">
                <img src={s.icon} alt={s.title} className="h-14 w-14 object-contain" />
                <span className="mt-2 text-sm font-semibold text-brand-navy">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <form className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">2. Data e horário</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data</span>
              <input type="date" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Horário</span>
              <input type="time" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Endereço</span>
            <input className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observações</span>
            <textarea rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
          </label>
          <button type="button" className="w-full rounded-full bg-[#2DD4BF] px-4 py-3 text-sm font-semibold text-white hover:brightness-110">
            Continuar para pagamento
          </button>
        </form>
      </div>
    </SitePage>
  );
}
