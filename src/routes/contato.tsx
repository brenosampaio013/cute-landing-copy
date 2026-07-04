import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Maré Nobre" },
      { name: "description", content: "Entre em contato com a Maré Nobre." },
    ],
  }),
  component: Contato,
});

function Contato() {
  return (
    <SitePage title="Contato" subtitle="Fale com a gente — respondemos em até 24 horas.">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: Mail, label: "E-mail", value: "contato@marenobre.com" },
            { icon: Phone, label: "Telefone", value: "0800 123 4567" },
            { icon: MapPin, label: "Endereço", value: "Av. Paulista, 1000 — São Paulo, SP" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2DD4BF]/10 text-brand-navy">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
                <p className="text-sm font-semibold text-brand-navy">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nome</span>
            <input className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</span>
            <input type="email" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mensagem</span>
            <textarea rows={5} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
          </label>
          <button type="button" className="w-full rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white hover:brightness-125">
            Enviar mensagem
          </button>
        </form>
      </div>
    </SitePage>
  );
}
