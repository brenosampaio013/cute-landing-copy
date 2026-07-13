
-- Disponibilidade global da empresa

-- 1) Config singleton
CREATE TABLE public.disponibilidade_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  slot_duracao_min integer NOT NULL DEFAULT 60 CHECK (slot_duracao_min > 0),
  capacidade_por_slot integer NOT NULL DEFAULT 1 CHECK (capacidade_por_slot > 0),
  antecedencia_minima_min integer NOT NULL DEFAULT 120 CHECK (antecedencia_minima_min >= 0),
  janela_futura_dias integer NOT NULL DEFAULT 60 CHECK (janela_futura_dias > 0),
  poucos_horarios_threshold integer NOT NULL DEFAULT 3 CHECK (poucos_horarios_threshold >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.disponibilidade_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.disponibilidade_config TO authenticated;
GRANT ALL ON public.disponibilidade_config TO service_role;
ALTER TABLE public.disponibilidade_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config read all" ON public.disponibilidade_config FOR SELECT USING (true);
CREATE POLICY "config write admin" ON public.disponibilidade_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_disp_config_updated BEFORE UPDATE ON public.disponibilidade_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Grade semanal
CREATE TABLE public.disponibilidade_semanal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (hora_fim > hora_inicio),
  UNIQUE (dia_semana, hora_inicio, hora_fim)
);
GRANT SELECT ON public.disponibilidade_semanal TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.disponibilidade_semanal TO authenticated;
GRANT ALL ON public.disponibilidade_semanal TO service_role;
ALTER TABLE public.disponibilidade_semanal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "semanal read all" ON public.disponibilidade_semanal FOR SELECT USING (true);
CREATE POLICY "semanal write admin" ON public.disponibilidade_semanal FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_disp_semanal_updated BEFORE UPDATE ON public.disponibilidade_semanal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Exceções por data
CREATE TABLE public.disponibilidade_excecoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('bloqueio_dia','bloqueio_horario','horario_extra')),
  hora_inicio time,
  hora_fim time,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (tipo = 'bloqueio_dia' AND hora_inicio IS NULL AND hora_fim IS NULL)
    OR (tipo <> 'bloqueio_dia' AND hora_inicio IS NOT NULL AND hora_fim IS NOT NULL AND hora_fim > hora_inicio)
  )
);
CREATE INDEX idx_disp_excecoes_data ON public.disponibilidade_excecoes (data);
GRANT SELECT ON public.disponibilidade_excecoes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.disponibilidade_excecoes TO authenticated;
GRANT ALL ON public.disponibilidade_excecoes TO service_role;
ALTER TABLE public.disponibilidade_excecoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "excecoes read all" ON public.disponibilidade_excecoes FOR SELECT USING (true);
CREATE POLICY "excecoes write admin" ON public.disponibilidade_excecoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_disp_excecoes_updated BEFORE UPDATE ON public.disponibilidade_excecoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed
INSERT INTO public.disponibilidade_config (id) VALUES (true) ON CONFLICT DO NOTHING;
INSERT INTO public.disponibilidade_semanal (dia_semana, hora_inicio, hora_fim, ativo) VALUES
  (1,'08:00','18:00',true),
  (2,'08:00','18:00',true),
  (3,'08:00','18:00',true),
  (4,'08:00','18:00',true),
  (5,'08:00','18:00',true),
  (6,'08:00','12:00',true)
ON CONFLICT DO NOTHING;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.disponibilidade_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disponibilidade_semanal;
ALTER PUBLICATION supabase_realtime ADD TABLE public.disponibilidade_excecoes;
