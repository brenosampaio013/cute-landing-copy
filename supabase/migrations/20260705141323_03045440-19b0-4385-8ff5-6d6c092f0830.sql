
CREATE OR REPLACE FUNCTION public.validar_cupom(
  p_codigo TEXT,
  p_valor_pedido NUMERIC,
  p_cliente_id UUID DEFAULT auth.uid()
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.cupons%ROWTYPE;
  usos_totais INTEGER;
  usos_cliente INTEGER;
  desconto NUMERIC := 0;
BEGIN
  SELECT * INTO c FROM public.cupons WHERE codigo = upper(p_codigo) LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valido', false, 'motivo', 'Cupom não encontrado');
  END IF;

  IF NOT c.ativo THEN
    RETURN jsonb_build_object('valido', false, 'motivo', 'Cupom inativo');
  END IF;

  IF now() < c.inicio OR now() > c.fim THEN
    RETURN jsonb_build_object('valido', false, 'motivo', 'Cupom fora da vigência');
  END IF;

  IF c.min_pedido IS NOT NULL AND p_valor_pedido < c.min_pedido THEN
    RETURN jsonb_build_object('valido', false, 'motivo',
      format('Valor mínimo de R$ %s não atingido', c.min_pedido));
  END IF;

  SELECT COUNT(*) INTO usos_totais FROM public.cupom_usos WHERE cupom_id = c.id;
  IF c.limite_total > 0 AND usos_totais >= c.limite_total THEN
    RETURN jsonb_build_object('valido', false, 'motivo', 'Cupom esgotado');
  END IF;

  IF p_cliente_id IS NOT NULL THEN
    SELECT COUNT(*) INTO usos_cliente
      FROM public.cupom_usos WHERE cupom_id = c.id AND cliente_id = p_cliente_id;
    IF c.limite_por_cliente > 0 AND usos_cliente >= c.limite_por_cliente THEN
      RETURN jsonb_build_object('valido', false, 'motivo', 'Limite por cliente atingido');
    END IF;
  END IF;

  IF c.tipo = 'percentual' THEN
    desconto := round(p_valor_pedido * c.valor / 100, 2);
    IF c.desconto_max IS NOT NULL AND desconto > c.desconto_max THEN
      desconto := c.desconto_max;
    END IF;
  ELSIF c.tipo = 'fixo' THEN
    desconto := c.valor;
  ELSE
    desconto := 0;
  END IF;

  IF desconto > p_valor_pedido THEN desconto := p_valor_pedido; END IF;

  RETURN jsonb_build_object(
    'valido', true,
    'cupom_id', c.id,
    'codigo', c.codigo,
    'tipo', c.tipo,
    'desconto', desconto,
    'total_final', p_valor_pedido - desconto
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validar_cupom(TEXT, NUMERIC, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validar_cupom(TEXT, NUMERIC, UUID) TO authenticated;
