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
    return "E-mail ou senha incorretos. Confira e tente novamente.";
  if (m.includes("user already") || m.includes("already registered"))
    return "Este e-mail já tem uma conta na Maré Nobre. Faça login ou recupere sua senha.";
  if (m.includes("email") && m.includes("invalid"))
    return "Este e-mail parece inválido. Confira o formato.";
  if (m.includes("password") && m.includes("6"))
    return "Sua senha precisa de no mínimo 6 caracteres.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar — verifique também a caixa de spam.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.";
  return message || "Algo deu errado. Tente novamente em instantes.";
}
