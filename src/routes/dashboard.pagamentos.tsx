import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Maré Nobre" }] }),
  component: Pagamentos,
});

type Row = {
  id: string;
  valor: number;
  status: "pago" | "pendente" | "estornado";
  data_pagamento: string | null;
  metodo: string | null;
  agendamentos: { servico: string; data: string } | null;
};

const statusMap = {
  pago: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Pago" },
  pendente: { cls: "bg-amber-50 text-amber-700 ring-amber-200", label: "Pendente" },
  estornado: { cls: "bg-slate-100 text-slate-700 ring-slate-200", label: "Estornado" },
};

function Pagamentos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pagamentos")
        .select("id, valor, status, data_pagamento, metodo, agendamentos!inner(servico, data, cliente_id)")
        .eq("agendamentos.cliente_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as unknown as Row[] | null) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const total = rows
    .filter((r) => r.status === "pago")
    .reduce((sum, r) => sum + Number(r.valor), 0);

  return (
    <>
      <PageHeading title="Pagamentos" subtitle="Histórico de transações dos seus serviços." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Total pago</p>
              <p className="text-lg font-bold text-[#0A1A2F]">R$ {total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4 font-medium">Data</th>
                  <th className="pb-3 pr-4 font-medium">Serviço</th>
                  <th className="pb-3 pr-4 font-medium">Valor</th>
                  <th className="pb-3 pr-4 font-medium">Método</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const s = statusMap[r.status];
                  const data = r.data_pagamento ?? r.agendamentos?.data;
                  return (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 text-slate-600">
                        {data ? new Date(data).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{r.agendamentos?.servico ?? "—"}</td>
                      <td className="py-3 pr-4 font-semibold text-[#0A1A2F]">
                        R$ {Number(r.valor).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{r.metodo ?? "—"}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${s.cls}`}>
                          {r.status === "pago" && <CheckCircle2 className="h-3 w-3" />}
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
