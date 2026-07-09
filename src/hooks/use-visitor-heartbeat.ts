import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "mn_visitor_sid";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = window.localStorage.getItem(STORAGE_KEY);
  if (!sid) {
    sid =
      (crypto?.randomUUID?.() as string | undefined) ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, sid);
  }
  return sid;
}

/**
 * Registra o visitante (logado ou anônimo) na tabela `visitantes` e
 * mantém `last_seen` atualizado enquanto a aba está aberta. Alimenta
 * a página "Visitantes ao vivo" do painel admin.
 */
export function useVisitorHeartbeat() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sid = getSessionId();
    if (!sid) return;

    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      try {
        await supabase.from("visitantes").upsert(
          {
            session_id: sid,
            user_id: user?.id ?? null,
            path: pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "session_id" },
        );
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
  }, [user, pathname]);
}
