import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Crown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fetchAds, trackAd, type AdCampaign } from "@/lib/ads";
import { useSubscription } from "@/hooks/use-subscription";
import { tap } from "@/lib/haptics";

interface Props {
  placement: string;
  /** Filtra por categoria de campanha (opcional). */
  category?: string;
  className?: string;
}

/** Banner patrocinado de marcas de moda. Oculto para assinantes Premium. */
export function SponsoredAd({ placement, category, className }: Props) {
  const { isPremium, loading } = useSubscription();
  const { data } = useQuery({
    queryKey: ["ads"],
    queryFn: fetchAds,
    staleTime: 5 * 60_000,
  });

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

  if (loading || isPremium || !ad) return null;

  return (
    <div ref={ref} className={"animate-rise " + (className ?? "")}>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <p className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Publicidade</p>
        <Link
          to="/app/premium"
          className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          <Crown size={10} className="text-gold" /> Remover
        </Link>
      </div>

      <a
        href={ad.url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => { tap(); void trackAd(ad, "click", placement); }}
        className="press block overflow-hidden rounded-3xl p-5 shadow-lift"
        style={{ background: ad.bg }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p
              className="text-[10px] uppercase tracking-[0.32em]"
              style={{ color: ad.accent }}
            >
              {ad.brand}
            </p>
            <p className="mt-1.5 font-display text-xl leading-tight text-white">{ad.headline}</p>
            <p className="mt-1 text-xs text-white/70">{ad.subline}</p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.22em]"
              style={{ background: ad.accent, color: "oklch(0.16 0.01 60)" }}
            >
              {ad.cta} <ExternalLink size={11} />
            </span>
          </div>
          <div
            className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl xs:flex"
            style={{ background: `color-mix(in oklch, ${ad.accent} 22%, transparent)` }}
          >
            <span className="font-display text-2xl" style={{ color: ad.accent }}>
              {ad.brand.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}
