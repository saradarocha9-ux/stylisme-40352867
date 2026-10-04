CREATE OR REPLACE FUNCTION public.protect_store_review_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.verified_at := OLD.verified_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_store_review_fields() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.protect_campaign_review_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    IF OLD.status NOT IN ('draft','rejected','paused') THEN RAISE EXCEPTION 'campaign is not editable'; END IF;
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.submitted_at := OLD.submitted_at;
    IF NEW.headline IS DISTINCT FROM OLD.headline OR NEW.destination_url IS DISTINCT FROM OLD.destination_url OR NEW.image_path IS DISTINCT FROM OLD.image_path THEN NEW.revision := OLD.revision + 1; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_campaign_review_fields() FROM PUBLIC, anon, authenticated;
DROP POLICY "Users claim store membership" ON public.store_members;
REVOKE INSERT ON public.store_members FROM authenticated;