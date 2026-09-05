REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_look_likes_count() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_ad_event_revenue() FROM public, anon, authenticated;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_barrier = true, security_invoker = false) AS
SELECT id, name, username, bio, link, avatar_url, banner_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO service_role;

DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

DROP POLICY IF EXISTS "Signed in read avatars" ON storage.objects;
CREATE POLICY "Read own or public profile images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.avatar_url = storage.objects.name OR p.banner_url = storage.objects.name
    )
  )
);

DROP POLICY IF EXISTS "Signed in users read look images" ON storage.objects;
CREATE POLICY "Read own or published look images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'looks'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.look_posts p WHERE p.image_path = storage.objects.name)
  )
);