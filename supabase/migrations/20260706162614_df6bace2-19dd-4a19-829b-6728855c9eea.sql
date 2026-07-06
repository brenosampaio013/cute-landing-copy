
-- Fix 1: Revoke EXECUTE on SECURITY DEFINER functions from client roles.
-- has_role is used by RLS policies (runs as definer regardless).
-- validar_cupom is not called from client code.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validar_cupom(text, numeric, uuid) FROM PUBLIC, anon, authenticated;

-- Fix 2: Restrict avatars bucket SELECT to the owner (folder = auth.uid()).
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Fix 3: Restrict chat-anexos SELECT to the file owner (folder = auth.uid()).
DROP POLICY IF EXISTS "Chat anexos: leitura pública" ON storage.objects;
CREATE POLICY "Chat anexos: dono lê"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-anexos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
