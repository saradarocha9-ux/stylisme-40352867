import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { safeExternalUrl, storeAssetUrl, type Campaign } from "@/lib/commerce";

type LiveCampaign = Campaign & { stores: { name: string; status: string } | null };

export function PartnerCampaignCard({ placement = "inspire-se" }: { placement?: string }) {
  const { isPremium } = useSubscription();
  const [campaign, setCampaign] = useState<LiveCampaign | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState("");
  useEffect(() => {
    const key = "stylisme:campaign-session";
    const existing = sessionStorage.getItem(key);
    if (existing) { setSessionKey(existing); return; }
    const created = crypto.randomUUID(); sessionStorage.setItem(key, created); setSessionKey(created);
  }, []);
  useEffect(() => {
    if (isPremium) return;
    const now = new Date().toISOString();
    void supabase.from("store_campaigns").select("*, stores(name,status)").eq("status", "active").or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`).limit(12).then(({ data }) => {
      const rows = (data ?? []) as unknown as LiveCampaign[];
      void supabase.auth.getUser().then(async ({ data: auth }) => {
        let city = "";
        if (auth.user) city = (await supabase.from("profiles").select("city").eq("id", auth.user.id).maybeSingle()).data?.city?.trim().toLocaleLowerCase("pt-BR") ?? "";
        const eligible = rows.filter((row) => {
          const targeting = row.targeting as { scope?: string; cities?: string[] } | null;
          return targeting?.scope !== "city" || Boolean(city && targeting.cities?.some((item) => item.trim().toLocaleLowerCase("pt-BR") === city));
        });
        if (eligible.length) setCampaign(eligible[Math.floor(Math.random() * eligible.length)] ?? null);
      });
    });
  }, [isPremium]);
  useEffect(() => { if (campaign && sessionKey) void record(campaign.id, "impression", placement, sessionKey); }, [campaign, placement, sessionKey]);
  useEffect(() => { if (campaign?.image_path) void storeAssetUrl(campaign.image_path).then(setImageUrl); }, [campaign]);
  if (isPremium || !campaign) return null;
  const url = safeExternalUrl(campaign.destination_url);
  return <article className="col-span-2 overflow-hidden rounded-3xl border border-gold/30 bg-card shadow-soft"><div className="aspect-[16/7] bg-muted">{imageUrl&&<img src={imageUrl} alt="" className="h-full w-full object-cover"/>}</div><div className="p-4"><p className="text-[9px] uppercase tracking-[0.2em] text-gold">Patrocinado · {campaign.stores?.name}</p><h2 className="mt-1 font-display text-2xl">Seu próximo look pode estar aqui</h2><p className="mt-1 text-sm text-muted-foreground">{campaign.headline}</p>{url&&<a href={url} target="_blank" rel="noopener noreferrer" onClick={()=>void record(campaign.id,"click",placement,sessionKey)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs text-primary-foreground">{campaign.cta} <ExternalLink size={13}/></a>}</div></article>;
}
async function record(campaignId:string,kind:"impression"|"click",placement:string,sessionKey:string){const bucket=kind==="impression"?Math.floor(Date.now()/3600000):Date.now();await supabase.from("campaign_events").insert({campaign_id:campaignId,user_id:(await supabase.auth.getUser()).data.user?.id??null,kind,placement,session_key:sessionKey,dedupe_key:`${campaignId}:${sessionKey}:${kind}:${bucket}`});}
