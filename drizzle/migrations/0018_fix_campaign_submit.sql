CREATE OR REPLACE FUNCTION public.protect_campaign_review_fields()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_submitting boolean := COALESCE(current_setting('stylisme.submitting_campaign', true), '') = NEW.id::text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    IF OLD.status NOT IN ('draft','rejected','paused') THEN RAISE EXCEPTION 'campaign is not editable'; END IF;
    IF v_submitting THEN
      NEW.status := 'submitted';
      NEW.rejection_reason := NULL;
      NEW.approved_at := OLD.approved_at;
      NEW.approved_by := OLD.approved_by;
    ELSE
      NEW.status := OLD.status;
      NEW.rejection_reason := OLD.rejection_reason;
      NEW.approved_at := OLD.approved_at;
      NEW.approved_by := OLD.approved_by;
      NEW.submitted_at := OLD.submitted_at;
      IF NEW.headline IS DISTINCT FROM OLD.headline OR NEW.destination_url IS DISTINCT FROM OLD.destination_url OR NEW.image_path IS DISTINCT FROM OLD.image_path THEN NEW.revision := OLD.revision + 1; END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.submit_store_campaign(_campaign_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_store uuid; v_status public.campaign_status;
BEGIN
  SELECT store_id, status INTO v_store, v_status FROM public.store_campaigns WHERE id = _campaign_id;
  IF v_store IS NULL OR NOT public.is_store_member(v_store) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_status NOT IN ('draft','rejected','paused') THEN RAISE EXCEPTION 'campaign cannot be submitted'; END IF;
  PERFORM set_config('stylisme.submitting_campaign', _campaign_id::text, true);
  UPDATE public.store_campaigns SET status='submitted', submitted_at=now(), rejection_reason=NULL, updated_at=now(), revision=revision+1 WHERE id=_campaign_id;
  PERFORM set_config('stylisme.submitting_campaign', '', true);
END $function$;