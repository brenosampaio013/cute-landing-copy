CREATE OR REPLACE FUNCTION public.validar_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- horário fim deve ser depois do início
  IF NEW.horario_fim <= NEW.horario_inicio THEN
    RAISE EXCEPTION 'Horário final deve ser posterior ao inicial.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- não permitir agendamento no passado (usa horário de Brasília)
  IF (NEW.data + NEW.horario_inicio) AT TIME ZONE 'America/Sao_Paulo' <= now() THEN
    RAISE EXCEPTION 'Não é possível agendar para um horário no passado.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- conflito com outro agendamento do mesmo profissional
  IF NEW.profissional_id IS NOT NULL AND NEW.status <> 'cancelado' THEN
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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_agendamento ON public.agendamentos;
CREATE TRIGGER trg_validar_agendamento
BEFORE INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.validar_agendamento();