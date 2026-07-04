import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Download, CheckCircle2 } from "lucide-react";
import { PageHeading } from "./dashboard";

export const Route = createFileRoute("/dashboard/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Maré Nobre" }] }),
  component: Pagamentos,
});

const rows = [
  { id: "#4821", date: "10 Jul 2026", service: "Limpeza Residencial", value: "R$ 180,00", status: "Pago" },
  { id: "#4790", date: "28 Jun 2026", service: "Passadoria", value: "R$ 90,00", status: "Pago" },
  { id: "#4755", date: "22 Jun 2026", service: "Limpeza Pós-obra", value: "R$ 420,00", status: "Pago" },
  { id: "#4712", date: "05 Jun 2026", service: "Limpeza Residencial", value: "R$ 180,00", status: "Pago" },
];

function Pagamentos() {
  return (
    <>
      <PageHeading
        title="Pagamentos"
        subtitle="Histórico de transações e método de pagamento."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg text-[#0A1A2F]"
              style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
            >
              Histórico
            </h3>
            <span className="text-xs text-slate-500">Últimos 30 dias</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4 font-medium">Recibo</th>
                  <th className="pb-3 pr-4 font-medium">Data</th>
                  <th className="pb-3 pr-4 font-medium">Serviço</th>
                  <th className="pb-3 pr-4 font-medium">Valor</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 font-semibold text-[#0A1A2F]">
                      {r.id}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{r.date}</td>
                    <td className="py-3 pr-4 text-slate-600">{r.service}</td>
                    <td className="py-3 pr-4 font-semibold text-[#0A1A2F]">
                      {r.value}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> {r.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        aria-label={`Baixar recibo ${r.id}`}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0A1A2F]"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3
            className="text-lg text-[#0A1A2F]"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Forma de pagamento
          </h3>
          <div className="mt-4 rounded-xl bg-[#0A1A2F] p-5 text-white">
            <div className="flex items-center justify-between">
              <CreditCard className="h-6 w-6 text-[#2DD4BF]" />
              <span className="text-xs uppercase tracking-wider text-white/60">
                Visa
              </span>
            </div>
            <p className="mt-6 font-mono text-lg tracking-widest">
              •••• •••• •••• 4242
            </p>
            <div className="mt-4 flex items-end justify-between text-xs text-white/70">
              <span>Juliana Silva</span>
              <span>12/28</span>
            </div>
          </div>
          <button className="mt-4 w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-[#0A1A2F] transition hover:bg-slate-200">
            Alterar cartão
          </button>
        </div>
      </div>
    </>
  );
}
