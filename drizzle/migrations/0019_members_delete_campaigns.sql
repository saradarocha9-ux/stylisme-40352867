DROP POLICY IF EXISTS "Members delete drafts" ON public.store_campaigns;
CREATE POLICY "Members delete own campaigns" ON public.store_campaigns FOR DELETE TO authenticated USING (public.is_store_member(store_id));
ALTER TABLE public.campaign_events DROP CONSTRAINT IF EXISTS campaign_events_campaign_id_fkey;
ALTER TABLE public.campaign_events ADD CONSTRAINT campaign_events_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.store_campaigns(id) ON DELETE CASCADE;