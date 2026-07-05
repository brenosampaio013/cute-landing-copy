-- Revoke direct EXECUTE from anon/authenticated/PUBLIC on SECURITY DEFINER
-- functions that are only meant to be used as triggers or inside RLS policies.

-- Trigger-only functions: never called directly
REVOKE ALL ON FUNCTION public.grant_admin_for_seed_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_admin_role() FROM PUBLIC, anon, authenticated;

-- Internal helper: not exposed to the client
REVOKE ALL ON FUNCTION public.check_agendamento_conflito(uuid, date, time, time, uuid) FROM PUBLIC, anon;

-- has_role is used inside RLS policies; policies run as the querying role,
-- so authenticated must keep EXECUTE. Revoke from anon only.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- validar_cupom is called from the client via RPC by signed-in users only.
-- Keep authenticated, revoke anon (already the case, but make it explicit).
REVOKE ALL ON FUNCTION public.validar_cupom(text, numeric, uuid) FROM PUBLIC, anon;
