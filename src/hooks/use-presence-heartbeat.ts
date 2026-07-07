import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Enquanto o usuário estiver autenticado, atualiza periodicamente o campo
 * `last_seen` no perfil. Isso alimenta a página "Clientes Online" do painel
 * admin (um cliente é considerado online se `last_seen` foi atualizado há
 * menos de ~2 minutos).
 */
export function usePresenceHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      try {
        await supabase
          .from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", user.id);
      } catch {
        /* silencioso */
      }
    };

    void ping();
    const interval = window.setInterval(ping, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);
}
