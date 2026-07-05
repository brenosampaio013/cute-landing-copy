import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = "administrador" | "gerente" | "suporte" | "financeiro" | "operador";
export type StatusU = "ativo" | "inativo" | "pendente";
export type Modulo =
  | "agendamentos" | "servicos" | "profissionais" | "clientes"
  | "pagamentos" | "cupons" | "relatorios" | "configuracoes";
export type Nivel = "nenhum" | "visualizar" | "editar";
export type Permissoes = Record<Modulo, Nivel>;

export type AdminUsuario = {
  id: string;
  user_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: Perfil;
  status: StatusU;
  permissoes: Permissoes;
  ultimo_acesso: string | null;
  created_at: string;
  updated_at: string;
};

const KEY = ["admin-usuarios"] as const;

export function useAdminUsuarios() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<AdminUsuario[]> => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminUsuario[];
    },
    staleTime: 30_000,
  });
}

export type UpsertInput = {
  id?: string;
  nome: string;
  email: string;
  telefone?: string | null;
  perfil: Perfil;
  status: StatusU;
  permissoes: Permissoes;
};

export function useUpsertAdminUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertInput) => {
      const payload = {
        nome: input.nome.trim(),
        email: input.email.trim().toLowerCase(),
        telefone: input.telefone?.trim() || null,
        perfil: input.perfil,
        status: input.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        permissoes: input.permissoes as unknown as Record<string, unknown>,
      };
      if (input.id) {
        const { error } = await supabase.from("admin_profiles").update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("admin_profiles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleAdminUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (u: AdminUsuario) => {
      const novo: StatusU = u.status === "ativo" ? "inativo" : "ativo";
      const { error } = await supabase.from("admin_profiles").update({ status: novo }).eq("id", u.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAdminUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
