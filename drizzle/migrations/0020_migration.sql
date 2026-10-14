CREATE TABLE public.look_dismissals (
  user_id uuid NOT NULL,
  post_id uuid NOT NULL REFERENCES public.look_posts(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE public.look_dismissals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.look_dismissals TO authenticated;
CREATE POLICY "Own dismissals read" ON public.look_dismissals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own dismissals insert" ON public.look_dismissals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own dismissals delete" ON public.look_dismissals FOR DELETE TO authenticated USING (auth.uid() = user_id);