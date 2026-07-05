-- agendamentos: usado por filtros e joins do dashboard, admin e relatórios
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_data
  ON public.agendamentos (cliente_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_data
  ON public.agendamentos (profissional_id, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_created_at
  ON public.agendamentos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status
  ON public.agendamentos (status);

-- pagamentos: filtros por criação e joins pelo agendamento
CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento
  ON public.pagamentos (agendamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at
  ON public.pagamentos (created_at DESC);

-- avaliacoes: listagens por cliente/profissional e por data
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente
  ON public.avaliacoes (cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional
  ON public.avaliacoes (profissional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_created_at
  ON public.avaliacoes (created_at DESC);
