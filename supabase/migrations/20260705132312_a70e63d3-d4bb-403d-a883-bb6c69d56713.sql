ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS anexo_url TEXT;

-- Storage policies for chat-anexos bucket (public read, authenticated write to own folder)
CREATE POLICY "Chat anexos: leitura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-anexos');

CREATE POLICY "Chat anexos: usuários autenticados enviam"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-anexos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Chat anexos: dono deleta"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-anexos' AND (storage.foldername(name))[1] = auth.uid()::text);