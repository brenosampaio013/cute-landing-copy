import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST so we don't miss events
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    // Then fetch the current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "E-mail ou senha incorretos.";
  if (m.includes("user already") || m.includes("already registered"))
    return "Este e-mail já está cadastrado.";
  if (m.includes("email") && m.includes("invalid"))
    return "E-mail inválido.";
  if (m.includes("password") && m.includes("6"))
    return "A senha deve ter no mínimo 6 caracteres.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Tente novamente em instantes.";
  return message || "Ocorreu um erro. Tente novamente.";
}
