import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { safeExternalUrl, storeAssetUrl, type Campaign } from "@/lib/commerce";

type LiveCampaign = Campaign & { stores: { name: string; status: string } | null };

export function PartnerCampaignCard({ placement = "inspire-se", variant = "horizontal" }: { placement?: string; variant?: "horizontal" | "vertical" }) {
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
    if (isPremium || !sessionKey) return;
    const frequencyKey = `stylisme:campaign-shown:${placement}`;
    const lastShown = Number(localStorage.getItem(frequencyKey) ?? 0);
    if (Date.now() - lastShown < 60 * 60 * 1000) return;
    const now = new Date().toISOString();
    void supabase.from("store_campaigns").select("*, stores(name,status)").in("status", ["approved", "active"]).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`).limit(12).then(({ data }) => {
      const rows = (data ?? []) as unknown as LiveCampaign[];
      void supabase.auth.getUser().then(async ({ data: auth }) => {
        let city = "";
        if (auth.user) city = (await supabase.from("profiles").select("city").eq("id", auth.user.id).maybeSingle()).data?.city?.trim().toLocaleLowerCase("pt-BR") ?? "";
        const eligible = rows.filter((row) => {
          const targeting = row.targeting as { scope?: string; cities?: string[] } | null;
          return targeting?.scope !== "city" || Boolean(city && targeting.cities?.some((item) => item.trim().toLocaleLowerCase("pt-BR") === city));
        });
        if (eligible.length) {
          setCampaign(eligible[Math.floor(Math.random() * eligible.length)] ?? null);
          localStorage.setItem(frequencyKey, String(Date.now()));
        }
      });
    });
  }, [isPremium, placement, sessionKey]);
  useEffect(() => { if (campaign && sessionKey) void record(campaign.id, "impression", placement, sessionKey); }, [campaign, placement, sessionKey]);
  useEffect(() => { if (campaign?.image_path) void storeAssetUrl(campaign.image_path).then(setImageUrl); }, [campaign]);
  if (isPremium || !campaign) return null;
  const url = safeExternalUrl(campaign.destination_url);
  const label = <p className="truncate text-[9px] uppercase tracking-[0.2em] text-gold">Patrocinado · {campaign.stores?.name}</p>;
  const go = () => void record(campaign.id, "click", placement, sessionKey);
  if (variant === "vertical") return <a href={url ?? undefined} target="_blank" rel="noopener noreferrer sponsored" onClick={go} className="block w-44 overflow-hidden rounded-2xl border border-border/60 bg-card/80 opacity-90 shadow-soft transition hover:opacity-100"><div className="aspect-[3/4] bg-muted">{imageUrl&&<img src={imageUrl} alt="" className="h-full w-full object-cover"/>}</div><div className="space-y-1 p-3">{label}<p className="line-clamp-3 text-xs">{campaign.headline}</p><span className="inline-flex items-center gap-1 text-[11px] underline">{campaign.cta} <ExternalLink size={11}/></span></div></a>;
  return <a href={url ?? undefined} target="_blank" rel="noopener noreferrer sponsored" onClick={go} className="col-span-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-2 pr-4 shadow-soft"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">{imageUrl&&<img src={imageUrl} alt="" className="h-full w-full object-cover"/>}</div><div className="min-w-0 flex-1">{label}<p className="line-clamp-2 text-xs">{campaign.headline}</p></div><span className="inline-flex shrink-0 items-center gap-1 text-[11px] underline">{campaign.cta} <ExternalLink size={11}/></span></a>;
}
async function record(campaignId:string,kind:"impression"|"click",placement:string,sessionKey:string){const bucket=kind==="impression"?Math.floor(Date.now()/3600000):Date.now();await supabase.from("campaign_events").insert({campaign_id:campaignId,user_id:(await supabase.auth.getUser()).data.user?.id??null,kind,placement,session_key:sessionKey,dedupe_key:`${campaignId}:${sessionKey}:${kind}:${bucket}`});}
