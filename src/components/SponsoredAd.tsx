import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, X, Crown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fetchAds, trackAd, type AdCampaign } from "@/lib/ads";
import { useSubscription } from "@/hooks/use-subscription";
import { tap } from "@/lib/haptics";
import { affiliateLink } from "@/lib/affiliate";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { adSlotFor, hideAdMobBanner, isAdSenseConfigured, isNativeApp, showAdMobBanner } from "@/lib/admob";

interface Props {
  placement: string;
  /** Filtra por categoria de campanha (opcional). */
  category?: string;
  className?: string;
}

/** Anúncios desativados. */
export function SponsoredAd(_props: Props) {
  return null;
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
