CREATE TABLE public.ai_request_leases (user_id uuid PRIMARY KEY, token uuid NOT NULL, expires_at timestamptz NOT NULL);
GRANT ALL ON public.ai_request_leases TO service_role;
ALTER TABLE public.ai_request_leases ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.acquire_ai_request() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_token uuid := gen_random_uuid(); v_result uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
 INSERT INTO public.ai_request_leases(user_id,token,expires_at) VALUES(auth.uid(),v_token,now()+interval '10 minutes')
 ON CONFLICT(user_id) DO UPDATE SET token=EXCLUDED.token,expires_at=EXCLUDED.expires_at WHERE ai_request_leases.expires_at < now() RETURNING token INTO v_result;
 RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.acquire_ai_request() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.acquire_ai_request() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.release_ai_request(_token uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN DELETE FROM public.ai_request_leases WHERE user_id=auth.uid() AND token=_token; END $$;
REVOKE ALL ON FUNCTION public.release_ai_request(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.release_ai_request(uuid) TO authenticated,service_role;
CREATE TABLE public.subscription_entity_versions(entity_key text PRIMARY KEY, event_created bigint NOT NULL, event_id text NOT NULL);
GRANT ALL ON public.subscription_entity_versions TO service_role;
ALTER TABLE public.subscription_entity_versions ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.apply_subscription_event(_event_id text,_event_type text,_payload_hash text,_event_created bigint,_user_id uuid,_store_id uuid,_premium boolean,_tier text,_until timestamptz,_subscription_id text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_entity text; v_created bigint; v_inserted text;
BEGIN
 IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'forbidden'; END IF;
 v_entity := CASE WHEN _store_id IS NOT NULL THEN 'store:'||_store_id::text ELSE 'user:'||COALESCE(_user_id::text,'none') END;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_entity,0));
 INSERT INTO public.subscription_events(provider_event_id,event_type,payload_hash,user_id) VALUES(_event_id,_event_type,_payload_hash,_user_id) ON CONFLICT DO NOTHING RETURNING provider_event_id INTO v_inserted;
 IF v_inserted IS NULL THEN RETURN false; END IF;
 SELECT event_created INTO v_created FROM public.subscription_entity_versions WHERE entity_key=v_entity;
 IF v_created IS NOT NULL AND _event_created < v_created THEN RETURN false; END IF;
 IF _store_id IS NOT NULL THEN
  UPDATE public.stores SET partner_tier=CASE WHEN _premium THEN _tier ELSE partner_tier END,partner_until=CASE WHEN _premium THEN _until ELSE now() END,partner_subscription_id=CASE WHEN _premium THEN _subscription_id ELSE partner_subscription_id END WHERE id=_store_id;
 ELSIF _user_id IS NOT NULL THEN UPDATE public.profiles SET plan=CASE WHEN _premium THEN 'premium' ELSE 'free' END WHERE id=_user_id;
 END IF;
 INSERT INTO public.subscription_entity_versions(entity_key,event_created,event_id) VALUES(v_entity,_event_created,_event_id) ON CONFLICT(entity_key) DO UPDATE SET event_created=EXCLUDED.event_created,event_id=EXCLUDED.event_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.apply_subscription_event(text,text,text,bigint,uuid,uuid,boolean,text,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_event(text,text,text,bigint,uuid,uuid,boolean,text,timestamptz,text) TO service_role;