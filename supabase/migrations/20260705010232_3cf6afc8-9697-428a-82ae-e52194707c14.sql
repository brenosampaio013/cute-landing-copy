CREATE OR REPLACE FUNCTION public.check_agendamento_conflito(
  p_profissional uuid,
  p_data date,
  p_inicio time,
  p_fim time,
  p_ignorar uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.profissional_id = p_profissional
      AND a.data = p_data
      AND a.status <> 'cancelado'
      AND (p_ignorar IS NULL OR a.id <> p_ignorar)
      AND a.horario_inicio < p_fim
      AND a.horario_fim > p_inicio
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_agendamento_conflito(uuid, date, time, time, uuid) TO authenticated;