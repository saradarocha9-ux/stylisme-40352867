CREATE OR REPLACE FUNCTION public.enforce_ad_event_revenue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.ad_campaigns%ROWTYPE;
BEGIN
  IF NEW.kind NOT IN ('impression', 'click') THEN
    RAISE EXCEPTION 'invalid ad event kind';
  END IF;

  SELECT * INTO c FROM public.ad_campaigns WHERE id = NEW.campaign_id;

  IF NOT FOUND OR c.active IS NOT TRUE THEN
    NEW.revenue_cents := 0;
  ELSIF NEW.kind = 'impression' THEN
    NEW.revenue_cents := GREATEST(0, ROUND(c.cpm_cents::numeric / 1000))::int;
  ELSE
    NEW.revenue_cents := GREATEST(0, c.cpc_cents);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ad_events_enforce_revenue ON public.ad_events;
CREATE TRIGGER ad_events_enforce_revenue
BEFORE INSERT OR UPDATE ON public.ad_events
FOR EACH ROW EXECUTE FUNCTION public.enforce_ad_event_revenue();

REVOKE EXECUTE ON FUNCTION public.enforce_ad_event_revenue() FROM PUBLIC, anon, authenticated;