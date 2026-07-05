
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  telefone text,
  perfil text NOT NULL DEFAULT 'operador' CHECK (perfil IN ('administrador','gerente','suporte','financeiro','operador')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativo','inativo','pendente')),
  permissoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultimo_acesso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_profiles_user_id_idx ON public.admin_profiles(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_profiles TO authenticated;
GRANT ALL ON public.admin_profiles TO service_role;

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver usuários internos"
  ON public.admin_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem criar usuários internos"
  ON public.admin_profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem editar usuários internos"
  ON public.admin_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem remover usuários internos"
  ON public.admin_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER admin_profiles_set_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sincroniza role 'admin' em user_roles quando perfil = 'administrador'
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id IS NOT NULL AND OLD.perfil = 'administrador' THEN
      DELETE FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'admin';
    END IF;
    RETURN OLD;
  END IF;

  -- INSERT ou UPDATE
  IF NEW.user_id IS NOT NULL AND NEW.perfil = 'administrador' AND NEW.status = 'ativo' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' AND OLD.user_id IS NOT NULL
        AND (OLD.perfil = 'administrador')
        AND (NEW.perfil <> 'administrador' OR NEW.status <> 'ativo' OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    DELETE FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'admin';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_profiles_sync_role
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_role();
