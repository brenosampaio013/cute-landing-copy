import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type ProfileDisplay = {
  nome: string | null;
  foto_url: string | null;
};

/**
 * Carrega dados de exibição (nome, foto) do profile do usuário logado.
 * Usa React Query para cachear entre navegações e evitar refetches em cada mount.
 */
export function useProfile(): {
  profile: ProfileDisplay | null;
  displayName: string;
  initial: string;
} {
  const { user } = useAuth();

  const { data: profile = null } = useQuery({
    queryKey: ["profile", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async (): Promise<ProfileDisplay> => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, foto_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data ?? { nome: null, foto_url: null };
    },
  });

  const displayName =
    profile?.nome ||
    (user?.user_metadata as { nome?: string } | undefined)?.nome ||
    user?.email ||
    "Cliente";
  const initial = displayName.trim().charAt(0).toUpperCase() || "C";

  return { profile, displayName, initial };
}
