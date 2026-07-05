
-- Enum para autor da mensagem
CREATE TYPE public.autor_mensagem AS ENUM ('admin', 'usuario');

-- Tabela de conversas (1 por usuário ↔ suporte admin)
CREATE TABLE public.conversas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ultima_mensagem TEXT,
  ultima_mensagem_at TIMESTAMPTZ,
  nao_lidas_admin INT NOT NULL DEFAULT 0,
  nao_lidas_usuario INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX conversas_user_id_idx ON public.conversas(user_id);
CREATE INDEX conversas_ultima_at_idx ON public.conversas(ultima_mensagem_at DESC NULLS LAST);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversas TO authenticated;
GRANT ALL ON public.conversas TO service_role;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_conversa_select" ON public.conversas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_own_conversa_insert" ON public.conversas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_own_conversa_update" ON public.conversas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER conversas_set_updated_at BEFORE UPDATE ON public.conversas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tabela de mensagens
CREATE TABLE public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_tipo public.autor_mensagem NOT NULL,
  conteudo TEXT NOT NULL CHECK (length(conteudo) > 0 AND length(conteudo) <= 4000),
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mensagens_conversa_idx ON public.mensagens(conversa_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensagens_select" ON public.mensagens FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND c.user_id = auth.uid())
  );
CREATE POLICY "mensagens_insert" ON public.mensagens FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND (
      (autor_tipo = 'admin' AND public.has_role(auth.uid(), 'admin'))
      OR (autor_tipo = 'usuario' AND EXISTS (
        SELECT 1 FROM public.conversas c WHERE c.id = conversa_id AND c.user_id = auth.uid()
      ))
    )
  );
CREATE POLICY "mensagens_update" ON public.mensagens FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = mensagens.conversa_id AND c.user_id = auth.uid())
  );

-- Trigger para atualizar conversa a cada mensagem nova
CREATE OR REPLACE FUNCTION public.on_nova_mensagem()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversas SET
    ultima_mensagem = LEFT(NEW.conteudo, 200),
    ultima_mensagem_at = NEW.created_at,
    nao_lidas_admin = CASE WHEN NEW.autor_tipo = 'usuario' THEN nao_lidas_admin + 1 ELSE nao_lidas_admin END,
    nao_lidas_usuario = CASE WHEN NEW.autor_tipo = 'admin' THEN nao_lidas_usuario + 1 ELSE nao_lidas_usuario END
  WHERE id = NEW.conversa_id;
  RETURN NEW;
END $$;

CREATE TRIGGER mensagens_after_insert AFTER INSERT ON public.mensagens
  FOR EACH ROW EXECUTE FUNCTION public.on_nova_mensagem();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;
