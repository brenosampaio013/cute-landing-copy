import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações — Maré Nobre" }] }),
  component: Avaliacoes,
});

type Aval = {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  agendamentos: { servico: string; data: string } | null;
};

function Avaliacoes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Aval[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, created_at, agendamentos(servico, data)")
        .eq("cliente_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data as unknown as Aval[] | null) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <>
      <PageHeading title="Minhas avaliações" subtitle="Seu feedback mantém o padrão Maré Nobre e recompensa os melhores profissionais." />
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Star className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#0A1A2F]">Nenhuma avaliação por aqui ainda</p>
          <p className="mt-1 text-xs text-slate-500">Após um serviço concluído, você poderá avaliá-lo.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((a) => (
            <div key={a.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#0A1A2F]">
                    {a.agendamentos?.servico ?? "Serviço"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < a.nota ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
              {a.comentario && (
                <p className="mt-3 text-sm text-slate-600">{a.comentario}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
