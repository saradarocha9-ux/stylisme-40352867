CREATE TABLE public.look_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  author_avatar text,
  title text NOT NULL,
  caption text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'geral',
  image_path text NOT NULL,
  garments jsonb NOT NULL DEFAULT '[]'::jsonb,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.look_posts TO authenticated;
GRANT ALL ON public.look_posts TO service_role;
ALTER TABLE public.look_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads look posts" ON public.look_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own look posts" ON public.look_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own look posts" ON public.look_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own look posts" ON public.look_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX look_posts_popular_idx ON public.look_posts (likes_count DESC, created_at DESC);
CREATE INDEX look_posts_recent_idx ON public.look_posts (created_at DESC);
CREATE INDEX look_posts_user_idx ON public.look_posts (user_id, created_at DESC);

CREATE TABLE public.look_likes (
  post_id uuid NOT NULL REFERENCES public.look_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.look_likes TO authenticated;
GRANT ALL ON public.look_likes TO service_role;
ALTER TABLE public.look_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads likes" ON public.look_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own like" ON public.look_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own like" ON public.look_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_look_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.look_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSE
    UPDATE public.look_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER look_likes_count_trigger
AFTER INSERT OR DELETE ON public.look_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_look_likes_count();

CREATE POLICY "Users upload own look images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'looks' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Signed in users read look images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'looks');
CREATE POLICY "Users delete own look images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'looks' AND (storage.foldername(name))[1] = auth.uid()::text);