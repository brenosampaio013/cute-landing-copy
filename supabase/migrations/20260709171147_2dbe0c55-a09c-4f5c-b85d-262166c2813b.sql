
-- Function to auto-create pagamento when agendamento is created
CREATE OR REPLACE FUNCTION public.criar_pagamento_para_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pagamentos (agendamento_id, valor, status)
  VALUES (NEW.id, COALESCE(NEW.total, NEW.preco, 0), 'pendente');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_criar_pagamento ON public.agendamentos;
CREATE TRIGGER trg_criar_pagamento
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_pagamento_para_agendamento();

-- Backfill: create pending pagamentos for existing agendamentos without one
INSERT INTO public.pagamentos (agendamento_id, valor, status)
SELECT a.id, COALESCE(a.total, a.preco, 0), 'pendente'
FROM public.agendamentos a
LEFT JOIN public.pagamentos p ON p.agendamento_id = a.id
WHERE p.id IS NULL;
