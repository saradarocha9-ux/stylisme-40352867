ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS link text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (lower(username)) WHERE username IS NOT NULL;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Signed in users read profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);