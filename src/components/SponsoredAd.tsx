import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { adSlotFor, hideAdMobBanner, isNativeApp, showAdMobBanner } from "@/lib/admob";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { useSubscription } from "@/hooks/use-subscription";

interface Props {
  placement: string;
  category?: string;
  className?: string;
}

/**
 * Anúncios: AdMob no app nativo, AdSense na web.
 * Usuários Premium nunca veem anúncios.
 */
export function SponsoredAd({ placement, className }: Props) {
  const { isPremium } = useSubscription();
  const native = isNativeApp();

  useEffect(() => {
    if (!native) return;
    if (isPremium) {
      void hideAdMobBanner();
      return;
    }
    void showAdMobBanner();
    return () => {
      void hideAdMobBanner();
    };
  }, [native, isPremium]);

  if (isPremium || native) return null;

  return (
    <div className={"mx-auto max-w-md px-4 pb-24 " + (className ?? "")}>
      <AdSenseUnit slot={adSlotFor(placement)} />
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
