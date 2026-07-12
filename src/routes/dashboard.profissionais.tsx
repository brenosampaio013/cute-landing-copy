import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Star, User } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais — Maré Nobre" }] }),
  component: Profissionais,
});

type Profi = {
  id: string;
  nome: string | null;
  foto_url: string | null;
  media: number;
  total: number;
};

function Profissionais() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Profi[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // profissionais que já atenderam este cliente
      const { data: ag } = await supabase
        .from("agendamentos")
        .select("profissional_id")
        .eq("cliente_id", user.id)
        .not("profissional_id", "is", null);

      const ids = Array.from(
        new Set((ag ?? []).map((a) => a.profissional_id).filter(Boolean) as string[])
      );
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const [{ data: profs }, { data: avals }] = await Promise.all([
        supabase.from("profiles").select("id, nome, foto_url").in("id", ids),
        supabase.from("avaliacoes").select("profissional_id, nota").in("profissional_id", ids),
      ]);

      const stats = new Map<string, { soma: number; n: number }>();
      (avals ?? []).forEach((a) => {
        if (!a.profissional_id) return;
        const cur = stats.get(a.profissional_id) ?? { soma: 0, n: 0 };
        cur.soma += a.nota;
        cur.n += 1;
        stats.set(a.profissional_id, cur);
      });

      const list: Profi[] = (profs ?? []).map((p) => {
        const s = stats.get(p.id);
        return {
          id: p.id,
          nome: p.nome,
          foto_url: p.foto_url,
          media: s ? s.soma / s.n : 0,
          total: s?.n ?? 0,
        };
      });
      setItems(list);
      setLoading(false);
    })();
  }, [user]);

  return (
    <>
      <PageHeading title="Meus profissionais" subtitle="Os profissionais Maré Nobre que já cuidaram do seu lar." />
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <User className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#0A1A2F]">Nenhum profissional por aqui ainda</p>
          <p className="mt-1 text-xs text-slate-500">Depois do primeiro atendimento, o profissional que cuidou do seu lar aparece aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center gap-4">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nome ?? ""} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2DD4BF] text-lg font-bold text-white">
                    {(p.nome ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-[#0A1A2F]">{p.nome ?? "Sem nome"}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {p.total > 0 ? `${p.media.toFixed(1)} · ${p.total} avaliações` : "Sem avaliações"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
