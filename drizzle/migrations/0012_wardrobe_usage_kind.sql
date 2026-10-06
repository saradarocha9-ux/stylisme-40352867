CREATE OR REPLACE FUNCTION public.consume_daily_usage(_kind text, _free_limit integer)
 RETURNS TABLE(allowed boolean, used integer, remaining integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_user uuid := auth.uid(); v_used integer; v_premium boolean;
BEGIN
  IF v_user IS NULL OR _kind NOT IN ('ai','tryon','planner','publish','wardrobe') OR _free_limit < 0 OR _free_limit > 50 THEN RAISE EXCEPTION 'invalid usage request'; END IF;
  SELECT plan = 'premium' INTO v_premium FROM public.profiles WHERE id = v_user;
  IF COALESCE(v_premium, false) THEN RETURN QUERY SELECT true, 0, 2147483647; RETURN; END IF;
  INSERT INTO public.daily_usage(user_id, usage_date, kind, used) VALUES(v_user, CURRENT_DATE, _kind, 0) ON CONFLICT DO NOTHING;
  SELECT d.used INTO v_used FROM public.daily_usage d WHERE d.user_id=v_user AND d.usage_date=CURRENT_DATE AND d.kind=_kind FOR UPDATE;
  IF v_used >= _free_limit THEN RETURN QUERY SELECT false, v_used, 0; RETURN; END IF;
  UPDATE public.daily_usage d SET used=d.used+1, updated_at=now() WHERE d.user_id=v_user AND d.usage_date=CURRENT_DATE AND d.kind=_kind RETURNING d.used INTO v_used;
  RETURN QUERY SELECT true, v_used, GREATEST(0, _free_limit-v_used);
END $function$;