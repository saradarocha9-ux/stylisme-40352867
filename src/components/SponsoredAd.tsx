import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { hideAdMobBanner, isNativeApp, showAdMobBanner } from "@/lib/admob";

interface Props {
  placement: string;
  category?: string;
  className?: string;
}

/**
 * Anúncios: desativados na web. No app nativo (Capacitor) exibe o banner AdMob.
 */
export function SponsoredAd(_props: Props) {
  useEffect(() => {
    if (!isNativeApp()) return;
    void showAdMobBanner();
    return () => {
      void hideAdMobBanner();
    };
  }, []);

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
