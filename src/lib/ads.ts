import { supabase } from "@/integrations/supabase/client";

export interface AdCampaign {
  id: string;
  brand: string;
  headline: string;
  subline: string;
  cta: string;
  url: string;
  category: string;
  accent: string;
  bg: string;
  priority: number;
  cpm_cents: number;
  cpc_cents: number;
}

export async function fetchAds(): Promise<AdCampaign[]> {
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("id, brand, headline, subline, cta, url, category, accent, bg, priority, cpm_cents, cpc_cents")
    .eq("active", true)
    .order("priority", { ascending: false });
  if (error) return [];
  return (data ?? []) as AdCampaign[];
}

/** Registra exibição/clique — é o que gera a receita cobrada dos anunciantes. */
export async function trackAd(
  ad: AdCampaign,
  kind: "impression" | "click",
  placement: string,
) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  const revenue = kind === "impression" ? Math.round(ad.cpm_cents / 1000) : ad.cpc_cents;
  await supabase.from("ad_events").insert({
    campaign_id: ad.id,
    user_id: userId,
    kind,
    placement,
    revenue_cents: revenue,
  });
}
