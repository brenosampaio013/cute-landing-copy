
-- ============ ENUMS ============
CREATE TYPE public.user_type AS ENUM ('cliente', 'profissional');
CREATE TYPE public.booking_status AS ENUM ('confirmado', 'concluido', 'cancelado', 'pendente');
CREATE TYPE public.payment_status AS ENUM ('pago', 'pendente', 'estornado');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  foto_url TEXT,
  tipo_usuario public.user_type NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============ AGENDAMENTOS ============
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  servico TEXT NOT NULL,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pendente',
  endereco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes leem seus agendamentos"
  ON public.agendamentos FOR SELECT
  USING (auth.uid() = cliente_id OR auth.uid() = profissional_id);
CREATE POLICY "Clientes criam agendamentos"
  ON public.agendamentos FOR INSERT
  WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Clientes atualizam seus agendamentos"
  ON public.agendamentos FOR UPDATE
  USING (auth.uid() = cliente_id)
  WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Clientes cancelam seus agendamentos"
  ON public.agendamentos FOR DELETE
  USING (auth.uid() = cliente_id);

-- ============ PAGAMENTOS ============
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pendente',
  data_pagamento TIMESTAMPTZ,
  metodo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes leem seus pagamentos"
  ON public.pagamentos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.id = pagamentos.agendamento_id
      AND (auth.uid() = a.cliente_id OR auth.uid() = a.profissional_id)
  ));
CREATE POLICY "Clientes criam pagamentos dos seus agendamentos"
  ON public.pagamentos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.id = pagamentos.agendamento_id
      AND auth.uid() = a.cliente_id
  ));

-- ============ AVALIACOES ============
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL UNIQUE REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes leem suas avaliacoes"
  ON public.avaliacoes FOR SELECT
  USING (auth.uid() = cliente_id OR auth.uid() = profissional_id);
CREATE POLICY "Clientes criam avaliacoes"
  ON public.avaliacoes FOR INSERT
  WITH CHECK (auth.uid() = cliente_id);
CREATE POLICY "Clientes atualizam avaliacoes"
  ON public.avaliacoes FOR UPDATE
  USING (auth.uid() = cliente_id)
  WITH CHECK (auth.uid() = cliente_id);

-- ============ TIMESTAMPS TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER agendamentos_set_updated_at
  BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE((NEW.raw_user_meta_data->>'tipo_usuario')::public.user_type, 'cliente')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
