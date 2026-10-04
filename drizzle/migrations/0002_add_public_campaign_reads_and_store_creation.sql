CREATE POLICY "Signed users read live campaigns" ON public.store_campaigns FOR SELECT TO authenticated USING (status = 'active' AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));

CREATE OR REPLACE FUNCTION public.create_store_with_owner(_name text, _slug text, _description text, _website_url text, _instagram_url text, _service_area jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_store uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  INSERT INTO public.stores(name, slug, description, website_url, instagram_url, service_area, status)
  VALUES(trim(_name), lower(trim(_slug)), trim(COALESCE(_description,'')), NULLIF(trim(COALESCE(_website_url,'')),''), NULLIF(trim(COALESCE(_instagram_url,'')),''), COALESCE(_service_area, '{}'::jsonb), 'pending')
  RETURNING id INTO v_store;
  INSERT INTO public.store_members(store_id, user_id, member_role) VALUES(v_store, v_user, 'owner');
  RETURN v_store;
END $$;
REVOKE ALL ON FUNCTION public.create_store_with_owner(text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_store_with_owner(text,text,text,text,text,jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_store_campaign(_campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_store uuid; v_status public.campaign_status;
BEGIN
  SELECT store_id, status INTO v_store, v_status FROM public.store_campaigns WHERE id = _campaign_id;
  IF NOT public.is_store_member(v_store) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_status NOT IN ('draft','rejected','paused') THEN RAISE EXCEPTION 'campaign cannot be submitted'; END IF;
  UPDATE public.store_campaigns SET status='submitted', submitted_at=now(), rejection_reason=NULL, updated_at=now(), revision=revision+1 WHERE id=_campaign_id;
END $$;
REVOKE ALL ON FUNCTION public.submit_store_campaign(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_store_campaign(uuid) TO authenticated, service_role;