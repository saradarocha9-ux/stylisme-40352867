DROP VIEW IF EXISTS public.public_profiles;

CREATE TABLE public.public_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  username text,
  bio text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  avatar_url text,
  banner_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT ALL ON public.public_profiles TO service_role;

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users read public profiles" ON public.public_profiles
FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_profiles (id, name, username, bio, link, avatar_url, banner_url, updated_at)
  VALUES (NEW.id, NEW.name, NEW.username, NEW.bio, NEW.link, NEW.avatar_url, NEW.banner_url, now())
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    bio = EXCLUDED.bio,
    link = EXCLUDED.link,
    avatar_url = EXCLUDED.avatar_url,
    banner_url = EXCLUDED.banner_url,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_public_profile() FROM public, anon, authenticated;

CREATE TRIGGER profiles_sync_public
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

INSERT INTO public.public_profiles (id, name, username, bio, link, avatar_url, banner_url)
SELECT id, name, username, bio, link, avatar_url, banner_url FROM public.profiles
ON CONFLICT (id) DO NOTHING;