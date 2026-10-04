CREATE OR REPLACE FUNCTION public.refund_daily_usage(_user_id uuid, _kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.daily_usage SET used = GREATEST(0, used - 1), updated_at = now()
  WHERE user_id = _user_id AND usage_date = CURRENT_DATE AND kind = _kind;
END $$;
REVOKE ALL ON FUNCTION public.refund_daily_usage(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_daily_usage(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_free_publication_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan text; v_count integer;
BEGIN
  IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'invalid publication owner'; END IF;
  SELECT plan INTO v_plan FROM public.profiles WHERE id = NEW.user_id;
  IF COALESCE(v_plan, 'free') = 'premium' THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM public.look_posts
  WHERE user_id = NEW.user_id AND created_at >= date_trunc('day', now());
  IF v_count >= 3 THEN RAISE EXCEPTION 'Limite diário do plano Free: 3 looks por dia.'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER look_posts_free_daily_limit
BEFORE INSERT ON public.look_posts
FOR EACH ROW EXECUTE FUNCTION public.enforce_free_publication_limit();