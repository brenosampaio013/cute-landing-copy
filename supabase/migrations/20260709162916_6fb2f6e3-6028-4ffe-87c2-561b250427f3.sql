
CREATE TABLE public.visitantes (
  session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_visitantes_last_seen ON public.visitantes (last_seen DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitantes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.visitantes TO anon;
GRANT ALL ON public.visitantes TO service_role;

ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor heartbeat"
  ON public.visitantes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update visitor heartbeat"
  ON public.visitantes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all visitors"
  ON public.visitantes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete visitors"
  ON public.visitantes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.visitantes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitantes;
