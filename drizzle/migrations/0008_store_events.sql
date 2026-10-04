CREATE TABLE public.store_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.store_products(id) ON DELETE CASCADE,
  user_id uuid,
  kind text NOT NULL CHECK (kind IN ('store_view','product_view','website_click','product_click')),
  session_key text NOT NULL CHECK (length(session_key) BETWEEN 8 AND 64),
  dedupe_key text NOT NULL UNIQUE CHECK (length(dedupe_key) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX store_events_store_idx ON public.store_events(store_id, created_at DESC);
GRANT SELECT, INSERT ON public.store_events TO authenticated;
GRANT INSERT ON public.store_events TO anon;
GRANT ALL ON public.store_events TO service_role;
ALTER TABLE public.store_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Record visits to verified stores" ON public.store_events FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.status = 'verified')
  AND (product_id IS NULL OR EXISTS (SELECT 1 FROM public.store_products p WHERE p.id = product_id AND p.store_id = store_events.store_id AND p.published))
);
CREATE POLICY "Members and staff read store events" ON public.store_events FOR SELECT TO authenticated
USING (public.is_store_member(store_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));