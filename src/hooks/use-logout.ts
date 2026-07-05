import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Encerra a sessão e redireciona para a home (ou destino informado).
 * Limpa o cache do React Query para evitar vazamento de dados entre contas
 * e usa navigate com replace para tirar a rota protegida do histórico.
 */
export function useLogout(redirectTo: "/" | "/login" = "/") {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useCallback(async () => {
    // Cancela queries em voo para não gerar 401 storm após signOut
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: redirectTo, replace: true });
  }, [navigate, redirectTo, queryClient]);
}
