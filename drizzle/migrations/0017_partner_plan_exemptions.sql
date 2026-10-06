CREATE TABLE public.partner_exemptions (
  user_id uuid PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.partner_exemptions TO service_role;
ALTER TABLE public.partner_exemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read exemptions" ON public.partner_exemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.partner_exemptions TO authenticated;

INSERT INTO public.partner_exemptions(user_id, note) VALUES ('252f1840-f348-472e-a9be-616e2c82b8eb', 'Campanhas sem pagamento autorizadas pelo dono');

CREATE OR REPLACE FUNCTION public.grant_exempt_partner_plan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'verified' AND (NEW.partner_until IS NULL OR NEW.partner_until < now())
     AND EXISTS (SELECT 1 FROM public.store_members m JOIN public.partner_exemptions e ON e.user_id = m.user_id
                 WHERE m.store_id = NEW.id AND m.member_role = 'owner') THEN
    NEW.partner_tier := 'nacional';
    NEW.partner_until := now() + interval '100 years';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.grant_exempt_partner_plan() FROM public, anon, authenticated;
CREATE TRIGGER zz_grant_exempt_partner_plan BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.grant_exempt_partner_plan();