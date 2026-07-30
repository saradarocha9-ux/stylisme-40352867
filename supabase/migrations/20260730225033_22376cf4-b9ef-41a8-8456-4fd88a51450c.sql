ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS network text NOT NULL DEFAULT 'awin',
  ADD COLUMN IF NOT EXISTS advertiser_id text;

UPDATE public.ad_campaigns SET network = 'awin' WHERE network IS NULL OR network = '';