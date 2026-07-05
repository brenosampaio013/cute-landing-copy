import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type ProfileDisplay = {
  nome: string | null;
  foto_url: string | null;
};

/**
 * Carrega dados de exibição (nome, foto) do profile do usuário logado.
 * Retorna `null` enquanto não há usuário ou enquanto a query não retornou.
 */
export function useProfile(): {
  profile: ProfileDisplay | null;
  displayName: string;
  initial: string;
} {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDisplay | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, foto_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled) setProfile(data ?? { nome: null, foto_url: null });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const displayName =
    profile?.nome ||
    (user?.user_metadata as { nome?: string } | undefined)?.nome ||
    user?.email ||
    "Cliente";
  const initial = displayName.trim().charAt(0).toUpperCase() || "C";

  return { profile, displayName, initial };
}
