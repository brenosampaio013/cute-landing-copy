import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Clock, Home, Loader2, Plus, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/agendamentos")({
  head: () => ({ meta: [{ title: "Agendamentos — Maré Nobre" }] }),
  component: Agendamentos,
});

type Status = "confirmado" | "concluido" | "cancelado" | "pendente";
type Agendamento = {
  id: string;
  servico: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  status: Status;
  endereco: string | null;
};

const badge: Record<Status, { cls: string; label: string }> = {
  confirmado: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Confirmado" },
  pendente: { cls: "bg-amber-50 text-amber-700 ring-amber-200", label: "Pendente" },
  concluido: { cls: "bg-slate-100 text-slate-700 ring-slate-200", label: "Concluído" },
  cancelado: { cls: "bg-red-50 text-red-700 ring-red-200", label: "Cancelado" },
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function Agendamentos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Agendamento[]>([]);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("cliente_id", user.id)
      .order("data", { ascending: false })
      .order("horario_inicio", { ascending: false });
    setItems((data as Agendamento[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  async function cancelar(id: string) {
    if (!confirm("Tem certeza que deseja cancelar este agendamento? Essa ação não pode ser desfeita.")) return;
    setCancelling(id);
    const { error } = await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", id);
    setCancelling(null);
    if (error) {
      toast.error("Não conseguimos cancelar agora. Tente novamente em instantes.");
      return;
    }
    toast.success("Agendamento cancelado com sucesso.");
    load();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading title="Meus agendamentos" subtitle="Acompanhe em tempo real os serviços marcados, em andamento e concluídos." />
        <Link
          to="/agendar"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2DD4BF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Novo agendamento
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#0A1A2F]">Nenhum agendamento ainda</p>
          <p className="mt-1 text-xs text-slate-500">Clique em "Novo agendamento" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((it) => {
            const b = badge[it.status];
            const podeCancelar = it.status === "confirmado" || it.status === "pendente";
            return (
              <div
                key={it.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A1A2F]">{it.servico}</p>
                    {it.endereco && <p className="text-xs text-slate-500">{it.endereco}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#2DD4BF]" /> {formatDate(it.data)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#2DD4BF]" />{" "}
                    {it.horario_inicio.slice(0, 5)} — {it.horario_fim.slice(0, 5)}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${b.cls}`}>
                    {b.label}
                  </span>
                  {podeCancelar && (
                    <button
                      onClick={() => cancelar(it.id)}
                      disabled={cancelling === it.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelling === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
