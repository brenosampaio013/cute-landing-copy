-- ============================================================
-- 1. Tabela profissionais
-- ============================================================
CREATE TABLE public.profissionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf TEXT,
  especialidades TEXT[] NOT NULL DEFAULT '{}',
  regiao TEXT,
  avaliacao_media NUMERIC(3,2) NOT NULL DEFAULT 0,
  atendimentos_concluidos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('ativo','inativo','pendente','bloqueado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profissionais_status ON public.profissionais(status);
CREATE INDEX idx_profissionais_user_id ON public.profissionais(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissionais TO authenticated;
GRANT ALL ON public.profissionais TO service_role;

ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam profissionais" ON public.profissionais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clientes leem profissionais ativos" ON public.profissionais
  FOR SELECT TO authenticated
  USING (status = 'ativo');

CREATE TRIGGER profissionais_set_updated_at
  BEFORE UPDATE ON public.profissionais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. Tabela profissional_horarios (grade semanal)
-- ============================================================
CREATE TABLE public.profissional_horarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (hora_fim > hora_inicio)
);

CREATE INDEX idx_prof_horarios_prof_dia
  ON public.profissional_horarios(profissional_id, dia_semana);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissional_horarios TO authenticated;
GRANT ALL ON public.profissional_horarios TO service_role;

ALTER TABLE public.profissional_horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam horarios" ON public.profissional_horarios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clientes leem horarios de profissionais ativos" ON public.profissional_horarios
  FOR SELECT TO authenticated
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = profissional_horarios.profissional_id
        AND p.status = 'ativo'
    )
  );

CREATE TRIGGER prof_horarios_set_updated_at
  BEFORE UPDATE ON public.profissional_horarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. Tabela profissional_bloqueios
-- ============================================================
CREATE TABLE public.profissional_bloqueios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (data_fim > data_inicio)
);

CREATE INDEX idx_prof_bloqueios_prof_range
  ON public.profissional_bloqueios(profissional_id, data_inicio, data_fim);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissional_bloqueios TO authenticated;
GRANT ALL ON public.profissional_bloqueios TO service_role;

ALTER TABLE public.profissional_bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam bloqueios" ON public.profissional_bloqueios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clientes leem bloqueios de profissionais ativos" ON public.profissional_bloqueios
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profissionais p
      WHERE p.id = profissional_bloqueios.profissional_id
        AND p.status = 'ativo'
    )
  );

CREATE TRIGGER prof_bloqueios_set_updated_at
  BEFORE UPDATE ON public.profissional_bloqueios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. Trocar FK de agendamentos.profissional_id
--    (antes apontava para auth.users; nenhuma linha atual tem valor)
-- ============================================================
ALTER TABLE public.agendamentos
  DROP CONSTRAINT agendamentos_profissional_id_fkey;

ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_profissional_id_fkey
  FOREIGN KEY (profissional_id) REFERENCES public.profissionais(id) ON DELETE SET NULL;

-- ============================================================
-- 5. Estender trigger validar_agendamento()
-- ============================================================
CREATE OR REPLACE FUNCTION public.validar_agendamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dia SMALLINT;
  v_grade_ok BOOLEAN;
  v_bloqueio BOOLEAN;
BEGIN
  -- horário fim > início
  IF NEW.horario_fim <= NEW.horario_inicio THEN
    RAISE EXCEPTION 'Horário final deve ser posterior ao inicial.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- não agendar no passado (America/Sao_Paulo)
  IF (NEW.data + NEW.horario_inicio) AT TIME ZONE 'America/Sao_Paulo' <= now() THEN
    RAISE EXCEPTION 'Não é possível agendar para um horário no passado.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.profissional_id IS NOT NULL AND NEW.status <> 'cancelado' THEN
    -- conflito com outro agendamento do mesmo profissional
    IF EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.profissional_id = NEW.profissional_id
        AND a.data = NEW.data
        AND a.status <> 'cancelado'
        AND a.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND a.horario_inicio < NEW.horario_fim
        AND a.horario_fim > NEW.horario_inicio
    ) THEN
      RAISE EXCEPTION 'Este profissional já possui um agendamento neste horário.'
        USING ERRCODE = 'exclusion_violation';
    END IF;

    -- grade semanal deve cobrir totalmente o intervalo pedido
    v_dia := EXTRACT(DOW FROM NEW.data)::SMALLINT;
    SELECT EXISTS (
      SELECT 1 FROM public.profissional_horarios h
      WHERE h.profissional_id = NEW.profissional_id
        AND h.dia_semana = v_dia
        AND h.ativo = true
        AND h.hora_inicio <= NEW.horario_inicio
        AND h.hora_fim   >= NEW.horario_fim
    ) INTO v_grade_ok;

    IF NOT v_grade_ok THEN
      RAISE EXCEPTION 'Horário fora da grade de disponibilidade do profissional.'
        USING ERRCODE = 'check_violation';
    END IF;

    -- bloqueio sobreposto ao intervalo pedido
    SELECT EXISTS (
      SELECT 1 FROM public.profissional_bloqueios b
      WHERE b.profissional_id = NEW.profissional_id
        AND b.data_inicio < ((NEW.data + NEW.horario_fim)    AT TIME ZONE 'America/Sao_Paulo')
        AND b.data_fim    > ((NEW.data + NEW.horario_inicio) AT TIME ZONE 'America/Sao_Paulo')
    ) INTO v_bloqueio;

    IF v_bloqueio THEN
      RAISE EXCEPTION 'Profissional indisponível neste período (bloqueio).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;