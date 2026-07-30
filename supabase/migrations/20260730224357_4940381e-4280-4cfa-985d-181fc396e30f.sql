CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  headline text NOT NULL,
  subline text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT 'Ver ofertas',
  url text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  accent text NOT NULL DEFAULT 'oklch(0.72 0.14 60)',
  bg text NOT NULL DEFAULT 'oklch(0.22 0.02 60)',
  priority int NOT NULL DEFAULT 1,
  cpm_cents int NOT NULL DEFAULT 900,
  cpc_cents int NOT NULL DEFAULT 65,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ad_campaigns TO anon;
GRANT SELECT ON public.ad_campaigns TO authenticated;
GRANT ALL ON public.ad_campaigns TO service_role;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active campaigns" ON public.ad_campaigns FOR SELECT TO anon, authenticated USING (active);

CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  placement text NOT NULL DEFAULT 'app',
  revenue_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ad_events TO authenticated;
GRANT ALL ON public.ad_events TO service_role;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own ad events" ON public.ad_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ad events" ON public.ad_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND kind IN ('impression','click'));

CREATE INDEX ad_events_campaign_idx ON public.ad_events (campaign_id, created_at DESC);

INSERT INTO public.ad_campaigns (brand, headline, subline, cta, url, category, accent, bg, priority, cpm_cents, cpc_cents) VALUES
('Renner', 'Novidades de estação na Renner', 'Peças-chave para renovar seu armário', 'Ver coleção', 'https://www.lojasrenner.com.br/', 'geral', 'oklch(0.72 0.17 25)', 'oklch(0.20 0.03 25)', 5, 1200, 80),
('C&A', 'C&A: básicos que combinam com tudo', 'Camisetas, jeans e alfaiataria', 'Comprar agora', 'https://www.cea.com.br/', 'basico', 'oklch(0.70 0.15 250)', 'oklch(0.20 0.03 250)', 4, 1000, 70),
('Riachuelo', 'Riachuelo tem seu próximo look', 'Moda feminina e masculina', 'Explorar', 'https://www.riachuelo.com.br/', 'geral', 'oklch(0.72 0.16 20)', 'oklch(0.19 0.02 20)', 3, 950, 65),
('ZARA', 'ZARA — nova temporada', 'Alfaiataria e peças statement', 'Descobrir', 'https://www.zara.com/br/', 'premium', 'oklch(0.85 0.01 60)', 'oklch(0.16 0.01 60)', 4, 1500, 110),
('AMARO', 'AMARO: elegância minimalista', 'Curadoria de peças atemporais', 'Ver seleção', 'https://amaro.com/', 'premium', 'oklch(0.78 0.10 40)', 'oklch(0.18 0.02 40)', 2, 1300, 95),
('FARM', 'FARM Rio — cor e estampa', 'Vestidos e prints exclusivos', 'Ver estampas', 'https://www.farmrio.com.br/', 'estampa', 'oklch(0.78 0.16 140)', 'oklch(0.19 0.03 150)', 2, 1100, 85),
('SHEIN', 'SHEIN: tendências por menos', 'Milhares de peças novas por dia', 'Aproveitar', 'https://br.shein.com/', 'promo', 'oklch(0.75 0.13 300)', 'oklch(0.18 0.03 300)', 1, 700, 45);