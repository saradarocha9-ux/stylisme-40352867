CREATE OR REPLACE FUNCTION public.consume_daily_usage(_kind text)
RETURNS TABLE(allowed boolean, used integer, remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_used integer;
  v_limit integer;
  v_premium boolean;
BEGIN
  IF v_user IS NULL OR _kind NOT IN ('ai','tryon','planner','publish') THEN
    RAISE EXCEPTION 'invalid usage request';
  END IF;
  v_limit := CASE _kind WHEN 'planner' THEN 3 WHEN 'publish' THEN 3 ELSE 3 END;
  SELECT plan = 'premium' INTO v_premium FROM public.profiles WHERE id = v_user;
  IF COALESCE(v_premium, false) THEN
    RETURN QUERY SELECT true, 0, 2147483647;
    RETURN;
  END IF;
  INSERT INTO public.daily_usage(user_id, usage_date, kind, used)
  VALUES(v_user, CURRENT_DATE, _kind, 0)
  ON CONFLICT DO NOTHING;
  SELECT d.used INTO v_used FROM public.daily_usage d
  WHERE d.user_id=v_user AND d.usage_date=CURRENT_DATE AND d.kind=_kind FOR UPDATE;
  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, v_used, 0;
    RETURN;
  END IF;
  UPDATE public.daily_usage d SET used=d.used+1, updated_at=now()
  WHERE d.user_id=v_user AND d.usage_date=CURRENT_DATE AND d.kind=_kind
  RETURNING d.used INTO v_used;
  RETURN QUERY SELECT true, v_used, GREATEST(0, v_limit-v_used);
END $$;
REVOKE ALL ON FUNCTION public.consume_daily_usage(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_daily_usage(text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.consume_daily_usage(text, integer) FROM authenticated;

CREATE OR REPLACE FUNCTION public.protect_store_review_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.verified_at := OLD.verified_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER protect_store_review_fields_before_update
BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.protect_store_review_fields();

CREATE OR REPLACE FUNCTION public.protect_membership_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND (NEW.store_id <> OLD.store_id OR NEW.user_id <> OLD.user_id OR NEW.member_role <> OLD.member_role) THEN
    RAISE EXCEPTION 'membership role changes require administrator approval';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_membership_roles_before_update
BEFORE UPDATE ON public.store_members FOR EACH ROW EXECUTE FUNCTION public.protect_membership_roles();

CREATE OR REPLACE FUNCTION public.protect_campaign_review_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    IF OLD.status NOT IN ('draft','rejected','paused') THEN
      RAISE EXCEPTION 'campaign is not editable';
    END IF;
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.submitted_at := OLD.submitted_at;
    IF NEW.headline IS DISTINCT FROM OLD.headline OR NEW.destination_url IS DISTINCT FROM OLD.destination_url OR NEW.image_path IS DISTINCT FROM OLD.image_path THEN
      NEW.revision := OLD.revision + 1;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER protect_campaign_review_fields_before_update
BEFORE UPDATE ON public.store_campaigns FOR EACH ROW EXECUTE FUNCTION public.protect_campaign_review_fields();