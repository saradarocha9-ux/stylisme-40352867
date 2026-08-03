-- 1) Likes: only own likes are readable; totals come from look_posts.likes_count
DROP POLICY IF EXISTS "Anyone signed in reads likes" ON public.look_likes;
CREATE POLICY "Users read own likes"
  ON public.look_likes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2) Profiles: full row readable only by the owner
DROP POLICY IF EXISTS "Signed in users read profiles" ON public.profiles;
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Safe public subset for other users (excludes plan and other private fields)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
  SELECT id, name, username, bio, link, avatar_url, banner_url
  FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT ALL ON public.public_profiles TO service_role;