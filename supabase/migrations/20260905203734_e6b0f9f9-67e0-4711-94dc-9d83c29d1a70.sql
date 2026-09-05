DROP POLICY IF EXISTS "Read own or public profile images" ON storage.objects;
CREATE POLICY "Read own or public profile images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.public_profiles p
      WHERE p.avatar_url = storage.objects.name OR p.banner_url = storage.objects.name
    )
  )
);