CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '',
  status report_status NOT NULL DEFAULT 'open',
  resolution_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_reports_not_self CHECK (reporter_id <> reported_user_id),
  CONSTRAINT user_reports_reason_len CHECK (char_length(reason) BETWEEN 1 AND 80 AND char_length(details) <= 1000)
);
GRANT SELECT, INSERT ON public.user_reports TO authenticated;
GRANT ALL ON public.user_reports TO service_role;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Report users as self" ON public.user_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND status = 'open' AND reviewed_by IS NULL);
CREATE POLICY "Read own or moderate user reports" ON public.user_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));