CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY "Admins podem criar usuários internos"
ON public.admin_profiles
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins podem editar usuários internos"
ON public.admin_profiles
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins podem remover usuários internos"
ON public.admin_profiles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins podem ver usuários internos"
ON public.admin_profiles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins atualizam agendamentos"
ON public.agendamentos
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins leem todos agendamentos"
ON public.agendamentos
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins leem todas avaliacoes"
ON public.avaliacoes
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "user_own_conversa_insert"
ON public.conversas
WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "user_own_conversa_select"
ON public.conversas
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "user_own_conversa_update"
ON public.conversas
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Cliente registra próprio uso"
ON public.cupom_usos
WITH CHECK ((cliente_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Cliente vê seus usos; admin vê tudo"
ON public.cupom_usos
USING ((cliente_id = auth.uid()) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins podem atualizar cupons"
ON public.cupons
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins podem criar cupons"
ON public.cupons
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins podem excluir cupons"
ON public.cupons
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "mensagens_insert"
ON public.mensagens
WITH CHECK (
  (autor_id = auth.uid())
  AND (
    ((autor_tipo = 'admin'::public.autor_mensagem) AND private.has_role(auth.uid(), 'admin'::public.app_role))
    OR (
      (autor_tipo = 'usuario'::public.autor_mensagem)
      AND EXISTS (
        SELECT 1
        FROM public.conversas c
        WHERE c.id = mensagens.conversa_id
          AND c.user_id = auth.uid()
      )
    )
  )
);

ALTER POLICY "mensagens_select"
ON public.mensagens
USING (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.conversas c
    WHERE c.id = mensagens.conversa_id
      AND c.user_id = auth.uid()
  )
);

ALTER POLICY "mensagens_update"
ON public.mensagens
USING (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.conversas c
    WHERE c.id = mensagens.conversa_id
      AND c.user_id = auth.uid()
  )
);

ALTER POLICY "Admins leem todos pagamentos"
ON public.pagamentos
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins leem todos profiles"
ON public.profiles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins manage roles"
ON public.user_roles
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Users read own roles"
ON public.user_roles
USING (auth.uid() = user_id);

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;