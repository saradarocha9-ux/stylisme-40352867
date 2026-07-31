import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, X, Crown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fetchAds, trackAd, type AdCampaign } from "@/lib/ads";
import { useSubscription } from "@/hooks/use-subscription";
import { tap } from "@/lib/haptics";
import { affiliateLink } from "@/lib/affiliate";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { hideAdMobBanner, isAdSenseConfigured, isNativeApp, showAdMobBanner } from "@/lib/admob";

interface Props {
  placement: string;
  /** Filtra por categoria de campanha (opcional). */
  category?: string;
  className?: string;
}

/** Chip patrocinado discreto no canto da tela. Oculto para assinantes Premium. */
export function SponsoredAd({ placement, category, className }: Props) {
  const { isPremium, loading } = useSubscription();
  const { data } = useQuery({
    queryKey: ["ads"],
    queryFn: fetchAds,
    staleTime: 5 * 60_000,
  });
  const [dismissed, setDismissed] = useState(false);

  const ad = useMemo<AdCampaign | null>(() => {
    if (!data?.length) return null;
    const pool = category ? data.filter((a) => a.category === category) : data;
    const list = pool.length ? pool : data;
    // Rotação ponderada por prioridade.
    const weighted = list.flatMap((a) => Array(Math.max(1, a.priority)).fill(a) as AdCampaign[]);
    return weighted[Math.floor(Math.random() * weighted.length)] ?? null;
  }, [data, category]);

  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!ad || seen || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          void trackAd(ad, "impression", placement);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad, seen, placement]);

  if (loading || isPremium || !ad || dismissed) return null;

  return (
    <div
      ref={ref}
      className={
        "fixed inset-x-0 bottom-0 z-30 flex pointer-events-none animate-rise " + (className ?? "")
      }
    >
      <div className="mx-auto flex w-full max-w-md justify-end px-4 pb-28 pt-4 pointer-events-auto">
        <div
          className="relative flex min-w-[260px] max-w-[330px] items-center gap-3 overflow-hidden rounded-2xl border border-white/10 px-3 py-2.5 shadow-lift"
          style={{ background: ad.bg }}
        >
          <button
            onClick={() => { tap(); setDismissed(true); }}
            className="absolute right-1 top-1 rounded-full p-1 text-white/60 hover:text-white"
            aria-label="Fechar anúncio"
          >
            <X size={10} />
          </button>

          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
            style={{ background: `color-mix(in oklch, ${ad.accent} 22%, transparent)` }}
          >
            <span className="font-display text-sm font-semibold" style={{ color: ad.accent }}>
              {ad.brand.slice(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1 pr-4">
            <p
              className="text-[9px] uppercase tracking-[0.24em]"
              style={{ color: ad.accent }}
            >
              {ad.brand}
            </p>
            <p className="truncate text-xs font-medium leading-snug text-white">{ad.headline}</p>
          </div>

          <a
            href={affiliateLink({
              url: ad.url,
              network: ad.network,
              advertiserId: ad.advertiser_id,
              campaignId: ad.id,
              placement,
            })}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={() => { tap(); void trackAd(ad, "click", placement); }}
            className="press flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-[10px] uppercase tracking-[0.16em]"
            style={{ background: ad.accent, color: "oklch(0.16 0.01 60)" }}
          >
            {ad.cta} <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}

/** Pequeno link "Remover anúncios" para colocar próximo ao chip, se desejado. */
export function RemoveAdsLink() {
  return (
    <Link
      to="/app/premium"
      className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
    >
      <Crown size={10} className="text-gold" /> Remover
    </Link>
  );
}
