ALTER TABLE public.stores ADD COLUMN partner_tier text CHECK (partner_tier IN ('municipal','regional','nacional'));
ALTER TABLE public.stores ADD COLUMN partner_until timestamptz;
ALTER TABLE public.stores ADD COLUMN partner_subscription_id text;

CREATE OR REPLACE FUNCTION public.protect_store_review_fields()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.verified_at := OLD.verified_at;
    NEW.partner_tier := OLD.partner_tier;
    NEW.partner_until := OLD.partner_until;
    NEW.partner_subscription_id := OLD.partner_subscription_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.campaign_fits_partner_plan(_store_id uuid, _targeting jsonb)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = _store_id AND s.status = 'verified' AND s.partner_until > now()
      AND CASE
        WHEN COALESCE(_targeting->>'scope','national') <> 'city' THEN s.partner_tier = 'nacional'
        WHEN jsonb_array_length(COALESCE(_targeting->'cities','[]'::jsonb)) <= 1 THEN true
        ELSE s.partner_tier IN ('regional','nacional')
      END
  )
$$;

DROP POLICY "Signed users read live campaigns" ON public.store_campaigns;
CREATE POLICY "Signed users read live campaigns" ON public.store_campaigns FOR SELECT TO authenticated
USING (status IN ('approved','active') AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()) AND public.campaign_fits_partner_plan(store_id, targeting));