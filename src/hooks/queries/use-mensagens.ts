import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Conversa = {
  id: string;
  user_id: string;
  ultima_mensagem: string | null;
  ultima_mensagem_at: string | null;
  nao_lidas_admin: number;
  nao_lidas_usuario: number;
  updated_at: string;
  usuario?: { nome: string | null; email: string | null; tipo_usuario: string | null } | null;
};

export type Mensagem = {
  id: string;
  conversa_id: string;
  autor_id: string;
  autor_tipo: "admin" | "usuario";
  conteudo: string;
  lida: boolean;
  created_at: string;
};

/** Admin: lista todas as conversas com nome do usuário */
export function useAdminConversas(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel("admin-conversas")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversas" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-conversas"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [enabled, qc]);

  return useQuery({
    queryKey: ["admin-conversas"],
    enabled,
    queryFn: async (): Promise<Conversa[]> => {
      const { data, error } = await supabase
        .from("conversas")
        .select("id, user_id, ultima_mensagem, ultima_mensagem_at, nao_lidas_admin, nao_lidas_usuario, updated_at")
        .order("ultima_mensagem_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      const ids = (data ?? []).map((c) => c.user_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles").select("id, nome, email, tipo_usuario").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((c) => ({ ...c, usuario: map.get(c.user_id) ?? null }));
    },
  });
}

/** Usuário: obtém ou cria sua própria conversa com o suporte */
export function useMinhaConversa(user: User | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`minha-conversa-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversas", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["minha-conversa", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["minha-conversa", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Conversa | null> => {
      if (!user) return null;
      const { data: existing } = await supabase
        .from("conversas").select("*").eq("user_id", user.id).maybeSingle();
      if (existing) return existing as Conversa;
      const { data: created, error } = await supabase
        .from("conversas").insert({ user_id: user.id }).select().single();
      if (error) throw error;
      return created as Conversa;
    },
  });
}

/** Mensagens de uma conversa (admin ou usuário) com realtime */
export function useMensagens(conversaId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversaId) return;
    const ch = supabase
      .channel(`mensagens-${conversaId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens", filter: `conversa_id=eq.${conversaId}` }, () => {
        qc.invalidateQueries({ queryKey: ["mensagens", conversaId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversaId, qc]);

  return useQuery({
    queryKey: ["mensagens", conversaId],
    enabled: !!conversaId,
    queryFn: async (): Promise<Mensagem[]> => {
      const { data, error } = await supabase
        .from("mensagens").select("*").eq("conversa_id", conversaId!).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Mensagem[];
    },
  });
}

/** Envia mensagem (admin ou usuário) */
export function useEnviarMensagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { conversaId: string; autorId: string; autorTipo: "admin" | "usuario"; conteudo: string }) => {
      const { error } = await supabase.from("mensagens").insert({
        conversa_id: v.conversaId, autor_id: v.autorId, autor_tipo: v.autorTipo, conteudo: v.conteudo,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["mensagens", v.conversaId] });
      qc.invalidateQueries({ queryKey: ["admin-conversas"] });
      qc.invalidateQueries({ queryKey: ["minha-conversa"] });
    },
  });
}

/** Marca como lidas as mensagens da outra parte */
export function useMarcarLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { conversaId: string; comoAdmin: boolean }) => {
      await supabase.from("mensagens").update({ lida: true })
        .eq("conversa_id", v.conversaId).eq("lida", false)
        .eq("autor_tipo", v.comoAdmin ? "usuario" : "admin");
      await supabase.from("conversas").update(
        v.comoAdmin ? { nao_lidas_admin: 0 } : { nao_lidas_usuario: 0 }
      ).eq("id", v.conversaId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-conversas"] });
      qc.invalidateQueries({ queryKey: ["minha-conversa"] });
    },
  });
}
