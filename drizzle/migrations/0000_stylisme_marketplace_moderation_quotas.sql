CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.store_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'scheduled', 'active', 'paused', 'rejected', 'ended');
CREATE TYPE public.report_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.look_posts ADD COLUMN IF NOT EXISTS is_editorial boolean NOT NULL DEFAULT false;
ALTER TABLE public.look_posts ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE public.look_posts ADD COLUMN IF NOT EXISTS suspension_reason text;
COMMENT ON TABLE public.ad_campaigns IS 'DEPRECATED for direct store campaigns: retained for legacy ad-network placements.';

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '',
  logo_path text,
  instagram_url text,
  website_url text,
  service_area jsonb NOT NULL DEFAULT '{"scope":"national","cities":[]}'::jsonb,
  status public.store_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO anon;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'owner' CHECK (member_role IN ('owner','manager','analyst')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_members TO authenticated;
GRANT ALL ON public.store_members TO service_role;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_store_member(_store_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.store_members WHERE store_id = _store_id AND user_id = _user_id)
$$;
REVOKE ALL ON FUNCTION public.is_store_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Public reads verified stores" ON public.stores FOR SELECT TO anon USING (status = 'verified');
CREATE POLICY "Signed users read verified or own stores" ON public.stores FOR SELECT TO authenticated USING (status = 'verified' OR public.is_store_member(id) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Users create pending stores" ON public.stores FOR INSERT TO authenticated WITH CHECK (status = 'pending' AND verified_at IS NULL);
CREATE POLICY "Members update stores" ON public.stores FOR UPDATE TO authenticated USING (public.is_store_member(id) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.is_store_member(id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete stores" ON public.stores FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members read memberships" ON public.store_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users claim store membership" ON public.store_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND member_role = 'owner' AND NOT EXISTS (SELECT 1 FROM public.store_members sm WHERE sm.store_id = store_id));
CREATE POLICY "Owners manage memberships" ON public.store_members FOR UPDATE TO authenticated USING (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners delete memberships" ON public.store_members FOR DELETE TO authenticated USING (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 140),
  category text NOT NULL DEFAULT 'geral',
  description text NOT NULL DEFAULT '',
  image_path text,
  price_cents integer CHECK (price_cents IS NULL OR price_cents >= 0),
  destination_url text,
  service_area jsonb NOT NULL DEFAULT '{}'::jsonb,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_products TO authenticated;
GRANT SELECT ON public.store_products TO anon;
GRANT ALL ON public.store_products TO service_role;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published products" ON public.store_products FOR SELECT TO anon USING (published AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.status = 'verified'));
CREATE POLICY "Signed users read public or own products" ON public.store_products FOR SELECT TO authenticated USING ((published AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.status = 'verified')) OR public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members create products" ON public.store_products FOR INSERT TO authenticated WITH CHECK (public.is_store_member(store_id));
CREATE POLICY "Members update products" ON public.store_products FOR UPDATE TO authenticated USING (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members delete products" ON public.store_products FOR DELETE TO authenticated USING (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.store_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.store_products(id) ON DELETE SET NULL,
  name text NOT NULL,
  headline text NOT NULL,
  cta text NOT NULL CHECK (cta IN ('Ver produto','Explorar peças','Visitar Instagram')),
  destination_url text NOT NULL,
  image_path text,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  targeting jsonb NOT NULL DEFAULT '{"cities":[],"styles":[],"occasions":[]}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_campaigns TO authenticated;
GRANT ALL ON public.store_campaigns TO service_role;
ALTER TABLE public.store_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read campaigns" ON public.store_campaigns FOR SELECT TO authenticated USING (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Members create draft campaigns" ON public.store_campaigns FOR INSERT TO authenticated WITH CHECK (public.is_store_member(store_id) AND status = 'draft');
CREATE POLICY "Members update editable campaigns" ON public.store_campaigns FOR UPDATE TO authenticated USING ((public.is_store_member(store_id) AND status IN ('draft','rejected','paused')) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.is_store_member(store_id) OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Members delete drafts" ON public.store_campaigns FOR DELETE TO authenticated USING ((public.is_store_member(store_id) AND status = 'draft') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.store_campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_key text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('impression','click')),
  placement text NOT NULL DEFAULT 'inspire-se',
  dedupe_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.campaign_events TO authenticated;
GRANT ALL ON public.campaign_events TO service_role;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own campaign events" ON public.campaign_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Stores read campaign results" ON public.campaign_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.store_campaigns c WHERE c.id = campaign_id AND (public.is_store_member(c.store_id) OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.saved_inspirations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.look_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, post_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_inspirations TO authenticated;
GRANT ALL ON public.saved_inspirations TO service_role;
ALTER TABLE public.saved_inspirations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage saved inspirations" ON public.saved_inspirations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.look_posts(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam','assédio','conteúdo impróprio','direitos autorais','outro')),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  status public.report_status NOT NULL DEFAULT 'open',
  resolution_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, post_id)
);
GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open');
CREATE POLICY "Users read own reports moderators read all" ON public.content_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Moderators resolve reports" ON public.content_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TABLE public.daily_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  kind text NOT NULL CHECK (kind IN ('ai','tryon','planner','publish')),
  used integer NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, usage_date, kind)
);
GRANT SELECT ON public.daily_usage TO authenticated;
GRANT ALL ON public.daily_usage TO service_role;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.daily_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_daily_usage(_kind text, _free_limit integer)
RETURNS TABLE(allowed boolean, used integer, remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_used integer; v_premium boolean;
BEGIN
  IF v_user IS NULL OR _kind NOT IN ('ai','tryon','planner','publish') OR _free_limit < 0 THEN RAISE EXCEPTION 'invalid usage request'; END IF;
  SELECT plan = 'premium' INTO v_premium FROM public.profiles WHERE id = v_user;
  IF COALESCE(v_premium, false) THEN RETURN QUERY SELECT true, 0, 2147483647; RETURN; END IF;
  INSERT INTO public.daily_usage(user_id, usage_date, kind, used) VALUES(v_user, CURRENT_DATE, _kind, 0) ON CONFLICT DO NOTHING;
  SELECT d.used INTO v_used FROM public.daily_usage d WHERE d.user_id=v_user AND d.usage_date=CURRENT_DATE AND d.kind=_kind FOR UPDATE;
  IF v_used >= _free_limit THEN RETURN QUERY SELECT false, v_used, 0; RETURN; END IF;
  UPDATE public.daily_usage d SET used=d.used+1, updated_at=now() WHERE d.user_id=v_user AND d.usage_date=CURRENT_DATE AND d.kind=_kind RETURNING d.used INTO v_used;
  RETURN QUERY SELECT true, v_used, GREATEST(0, _free_limit-v_used);
END $$;
REVOKE ALL ON FUNCTION public.consume_daily_usage(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_daily_usage(text, integer) TO authenticated, service_role;

CREATE TABLE public.subscription_events (
  provider_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload_hash text NOT NULL
);
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'direct',
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.waitlist_entries TO anon, authenticated;
GRANT ALL ON public.waitlist_entries TO service_role;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone joins waitlist" ON public.waitlist_entries FOR INSERT TO anon, authenticated WITH CHECK (email ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');

CREATE INDEX store_products_store_idx ON public.store_products(store_id);
CREATE INDEX store_campaigns_store_status_idx ON public.store_campaigns(store_id, status);
CREATE INDEX campaign_events_campaign_kind_idx ON public.campaign_events(campaign_id, kind);
CREATE INDEX reports_status_created_idx ON public.content_reports(status, created_at);
CREATE INDEX look_posts_visible_idx ON public.look_posts(created_at DESC) WHERE suspended_at IS NULL;