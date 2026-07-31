import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";

interface Props {
  placement: string;
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
