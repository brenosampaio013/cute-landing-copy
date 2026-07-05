CREATE TABLE public.enderecos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rotulo TEXT NOT NULL DEFAULT 'Casa',
  cep TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_enderecos_cliente ON public.enderecos(cliente_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enderecos TO authenticated;
GRANT ALL ON public.enderecos TO service_role;

ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes gerenciam seus endereços"
  ON public.enderecos FOR ALL
  USING (auth.uid() = cliente_id)
  WITH CHECK (auth.uid() = cliente_id);

CREATE TRIGGER trg_enderecos_updated_at
  BEFORE UPDATE ON public.enderecos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();