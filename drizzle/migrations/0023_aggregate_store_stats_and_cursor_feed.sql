CREATE OR REPLACE FUNCTION public.store_stats_summary(_store_id uuid, _days integer DEFAULT 7) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public SET statement_timeout = '8s' AS $$
DECLARE result jsonb; since_at timestamptz := now() - make_interval(days => LEAST(30,GREATEST(1,_days)));
BEGIN
IF auth.uid() IS NULL OR NOT (public.is_store_member(_store_id,auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) THEN RAISE EXCEPTION 'forbidden'; END IF;
WITH se AS MATERIALIZED (SELECT kind,product_id,session_key,user_id,created_at FROM public.store_events WHERE store_id=_store_id AND created_at>=since_at),
ce AS MATERIALIZED (SELECT e.campaign_id,e.kind,e.session_key FROM public.campaign_events e JOIN public.store_campaigns c ON c.id=e.campaign_id WHERE c.store_id=_store_id AND e.created_at>=since_at)
SELECT jsonb_build_object(
'counts',(SELECT COALESCE(jsonb_object_agg(kind,n),'{}'::jsonb) FROM (SELECT kind,count(*) n FROM se GROUP BY kind) x),
'visitors',(SELECT count(DISTINCT session_key) FROM se WHERE kind='store_view'),
'signedIn',(SELECT count(DISTINCT user_id) FROM se),
'impressions',(SELECT count(*) FROM ce WHERE kind='impression'),
'adClicks',(SELECT count(*) FROM ce WHERE kind='click'),
'daily',(SELECT COALESCE(jsonb_agg(x),'[]'::jsonb) FROM (SELECT (created_at AT TIME ZONE 'UTC')::date::text d,count(*) v FROM se WHERE kind IN ('store_view','product_view') GROUP BY 1 ORDER BY 1) x),
'products',(SELECT COALESCE(jsonb_agg(x),'[]'::jsonb) FROM (SELECT product_id id,count(*) FILTER (WHERE kind='product_view') views,count(*) FILTER (WHERE kind='product_click') clicks FROM se WHERE product_id IS NOT NULL GROUP BY product_id) x),
'campaigns',(SELECT COALESCE(jsonb_agg(x),'[]'::jsonb) FROM (SELECT campaign_id id,count(*) FILTER (WHERE kind='impression') imp,count(*) FILTER (WHERE kind='click') clk,count(DISTINCT session_key) people FROM ce GROUP BY campaign_id) x)
) INTO result;
RETURN result; END $$;
REVOKE ALL ON FUNCTION public.store_stats_summary(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.store_stats_summary(uuid,integer) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.feed_page(_sort text DEFAULT 'recentes',_category text DEFAULT 'todos',_search text DEFAULT '',_cursor_date timestamptz DEFAULT NULL,_cursor_id uuid DEFAULT NULL,_cursor_likes integer DEFAULT NULL,_limit integer DEFAULT 24)
RETURNS SETOF public.look_posts LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public SET statement_timeout='8s' AS $$
BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
IF _sort NOT IN ('recentes','populares','seguindo') THEN RAISE EXCEPTION 'invalid sort'; END IF;
RETURN QUERY SELECT p.* FROM public.look_posts p WHERE p.suspended_at IS NULL
AND (_category='todos' OR p.category=_category)
AND (_search='' OR p.title ILIKE '%'||left(_search,80)||'%' OR p.caption ILIKE '%'||left(_search,80)||'%' OR p.author_name ILIKE '%'||left(_search,80)||'%')
AND (_sort<>'seguindo' OR EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id=auth.uid() AND f.following_id=p.user_id))
AND NOT EXISTS (SELECT 1 FROM public.look_dismissals d WHERE d.user_id=auth.uid() AND d.post_id=p.id)
AND (_cursor_date IS NULL OR CASE WHEN _sort='populares' THEN (p.likes_count,p.created_at,p.id)<(_cursor_likes,_cursor_date,_cursor_id) ELSE (p.created_at,p.id)<(_cursor_date,_cursor_id) END)
ORDER BY CASE WHEN _sort='populares' THEN p.likes_count END DESC,p.created_at DESC,p.id DESC LIMIT LEAST(49,GREATEST(1,_limit)); END $$;
REVOKE ALL ON FUNCTION public.feed_page(text,text,text,timestamptz,uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.feed_page(text,text,text,timestamptz,uuid,integer,integer) TO authenticated,service_role;
CREATE INDEX IF NOT EXISTS look_posts_cursor_recent_idx ON public.look_posts (created_at DESC,id DESC) WHERE suspended_at IS NULL;
CREATE INDEX IF NOT EXISTS look_posts_cursor_popular_idx ON public.look_posts (likes_count DESC,created_at DESC,id DESC) WHERE suspended_at IS NULL;