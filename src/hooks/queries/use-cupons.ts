import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CupomRow = Database["public"]["Tables"]["cupons"]["Row"];
export type CupomInsert = Database["public"]["Tables"]["cupons"]["Insert"];
export type CupomUpdate = Database["public"]["Tables"]["cupons"]["Update"];

export type CupomComStats = CupomRow & {
  usos: number;
  desconto_total: number;
  ticket_medio: number;
};

const KEY = ["cupons"] as const;

async function fetchCuponsComStats(): Promise<CupomComStats[]> {
  const { data: cupons, error } = await supabase
    .from("cupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (cupons ?? []).map((c) => c.id);
  const statsMap = new Map<string, { usos: number; desconto_total: number; soma_pedido: number }>();

  if (ids.length) {
    const { data: usos, error: eu } = await supabase
      .from("cupom_usos")
      .select("cupom_id, valor_pedido, valor_desconto")
      .in("cupom_id", ids);
    if (eu) throw eu;
    for (const u of usos ?? []) {
      const cur = statsMap.get(u.cupom_id) ?? { usos: 0, desconto_total: 0, soma_pedido: 0 };
      cur.usos += 1;
      cur.desconto_total += Number(u.valor_desconto ?? 0);
      cur.soma_pedido += Number(u.valor_pedido ?? 0);
      statsMap.set(u.cupom_id, cur);
    }
  }

  return (cupons ?? []).map((c) => {
    const s = statsMap.get(c.id) ?? { usos: 0, desconto_total: 0, soma_pedido: 0 };
    return {
      ...c,
      usos: s.usos,
      desconto_total: s.desconto_total,
      ticket_medio: s.usos > 0 ? s.soma_pedido / s.usos : 0,
    };
  });
}

export function useCupons() {
  return useQuery({ queryKey: KEY, queryFn: fetchCuponsComStats });
}

export function useSaveCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CupomInsert & { id?: string }) => {
      const { id, ...values } = input;
      if (id) {
        const { data, error } = await supabase.from("cupons").update(values as CupomUpdate).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("cupons").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("cupons").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDuplicateCupom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: CupomRow) => {
      const { id: _id, created_at: _ca, updated_at: _ua, created_by: _cb, ...rest } = c;
      void _id; void _ca; void _ua; void _cb;
      const { error } = await supabase.from("cupons").insert({ ...rest, codigo: `${c.codigo}-COPIA-${Date.now().toString().slice(-4)}` });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
