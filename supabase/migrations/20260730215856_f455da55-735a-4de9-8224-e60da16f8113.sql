CREATE TABLE public.color_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  season_family TEXT NOT NULL DEFAULT '',
  undertone TEXT NOT NULL DEFAULT '',
  depth TEXT NOT NULL DEFAULT '',
  contrast TEXT NOT NULL DEFAULT '',
  chroma TEXT NOT NULL DEFAULT '',
  analysis JSONB NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.color_analyses TO authenticated;
GRANT ALL ON public.color_analyses TO service_role;

ALTER TABLE public.color_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own color analyses" ON public.color_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own color analyses" ON public.color_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own color analyses" ON public.color_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX color_analyses_user_created_idx ON public.color_analyses (user_id, created_at DESC);