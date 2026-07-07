import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Enquanto o usuário estiver autenticado, entra no canal de presença global
 * `presence:clientes` e atualiza periodicamente o campo `last_seen` no perfil.
 * Isso alimenta a página "Clientes Online" do painel admin.
 */
export function usePresenceHeartbeat() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("presence:clientes", {
      config: { presence: { key: user.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      /* estado de presença mantido pelo Supabase */
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });

    const ping = async () => {
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
    const interval = window.setInterval(ping, 60_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      void channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user]);
}
