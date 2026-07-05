
-- Enum para tipo de desconto
DO $$ BEGIN
  CREATE TYPE public.cupom_tipo AS ENUM ('percentual','fixo','frete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cupom_aplicavel AS ENUM ('todos','especificos','primeira');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela cupons
CREATE TABLE public.cupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL DEFAULT '',
  tipo public.cupom_tipo NOT NULL DEFAULT 'percentual',
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_pedido NUMERIC(10,2),
  desconto_max NUMERIC(10,2),
  limite_total INTEGER NOT NULL DEFAULT 0,
  limite_por_cliente INTEGER NOT NULL DEFAULT 1,
  inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim TIMESTAMPTZ NOT NULL,
  aplicavel public.cupom_aplicavel NOT NULL DEFAULT 'todos',
  servicos TEXT[] NOT NULL DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cupons_codigo_idx ON public.cupons (codigo);
CREATE INDEX cupons_ativo_idx ON public.cupons (ativo);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons TO authenticated;
GRANT ALL ON public.cupons TO service_role;

ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver cupons"
  ON public.cupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins podem criar cupons"
  ON public.cupons FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar cupons"
  ON public.cupons FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem excluir cupons"
  ON public.cupons FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER cupons_updated_at BEFORE UPDATE ON public.cupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tabela cupom_usos
CREATE TABLE public.cupom_usos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cupom_id UUID NOT NULL REFERENCES public.cupons(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  valor_pedido NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cupom_usos_cupom_idx ON public.cupom_usos (cupom_id);
CREATE INDEX cupom_usos_cliente_idx ON public.cupom_usos (cliente_id);

GRANT SELECT, INSERT ON public.cupom_usos TO authenticated;
GRANT ALL ON public.cupom_usos TO service_role;

ALTER TABLE public.cupom_usos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê seus usos; admin vê tudo"
  ON public.cupom_usos FOR SELECT TO authenticated
  USING (cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Cliente registra próprio uso"
  ON public.cupom_usos FOR INSERT TO authenticated
  WITH CHECK (cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
