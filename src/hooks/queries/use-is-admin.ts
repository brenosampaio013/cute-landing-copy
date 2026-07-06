import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se o usuário informado possui a role `admin` em `user_roles`.
 * Retorna `null` enquanto o resultado ainda não foi carregado.
 *
 * Usa TanStack Query para cachear o resultado por usuário, evitando re-fetch
 * a cada navegação entre páginas admin (que causava loader "eterno" ao trocar
 * de rota).
 */
export function useIsAdmin(user: User | null): boolean | null {
  const { data } = useQuery({
    queryKey: ["is-admin", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return !!data;
    },
  });

  if (!user) return null;
  return data ?? null;
}
