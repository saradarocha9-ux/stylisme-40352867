import { useEffect, useRef } from "react";
import { ADSENSE } from "@/lib/admob";

/** Bloco de anúncio do Google AdSense (versão web). */
export function AdSenseUnit({ className }: { className?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !ref.current) return;
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      /* noop */
    }
  }, []);

  return (
    <ins
      ref={ref}
      className={"adsbygoogle block " + (className ?? "")}
      style={{ display: "block", minHeight: 60 }}
      data-ad-client={ADSENSE.client}
      data-ad-slot={ADSENSE.slot}
      data-ad-format="horizontal"
      data-full-width-responsive="true"
    />
  );
}
