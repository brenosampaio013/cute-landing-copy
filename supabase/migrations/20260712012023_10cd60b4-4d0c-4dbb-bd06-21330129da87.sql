
CREATE TABLE public.ab_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment TEXT NOT NULL,
  variant TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('impression','conversion')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ab_events_experiment_variant_event_idx ON public.ab_events (experiment, variant, event);
CREATE INDEX ab_events_created_at_idx ON public.ab_events (created_at DESC);

GRANT SELECT, INSERT ON public.ab_events TO authenticated;
GRANT ALL ON public.ab_events TO service_role;

ALTER TABLE public.ab_events ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can log their own events
CREATE POLICY "Users can insert their own ab events"
  ON public.ab_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Only admins can read the aggregated results
CREATE POLICY "Admins can read ab events"
  ON public.ab_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
