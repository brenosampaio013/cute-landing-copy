import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Encerra a sessão e redireciona para a home (ou destino informado).
 * Centraliza o fluxo de logout usado em dashboard, admin e áreas protegidas.
 */
export function useLogout(redirectTo: "/" | "/login" = "/") {
  const navigate = useNavigate();
  return useCallback(async () => {
    await supabase.auth.signOut();
    navigate({ to: redirectTo });
  }, [navigate, redirectTo]);
}
