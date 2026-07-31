import { useEffect, useRef, useState } from "react";
import { ADSENSE } from "@/lib/admob";

const SCRIPT_ID = "google-adsense-js";

/** Garante que o script do AdSense esteja carregado. Resolve false se falhar. */
function loadAdSenseScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const w = window as unknown as { adsbygoogle?: unknown[] };
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "true") return Promise.resolve(true);
    if (existing.dataset.failed === "true") return Promise.resolve(false);
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      setTimeout(() => resolve(Array.isArray(w.adsbygoogle)), 6000);
    });
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.client}`;
    s.addEventListener("load", () => {
      s.dataset.loaded = "true";
      resolve(true);
    }, { once: true });
    s.addEventListener("error", () => {
      s.dataset.failed = "true";
      resolve(false);
    }, { once: true });
    document.head.appendChild(s);
    setTimeout(() => resolve(Array.isArray(w.adsbygoogle)), 6000);
  });
}

interface Props {
  className?: string;
  /** Chamado quando o anúncio não pôde ser exibido (bloqueado, sem preenchimento, erro). */
  onUnavailable?: () => void;
}

/**
 * Bloco de anúncio do Google AdSense (versão web).
 *
 * Só renderiza após a hidratação (evita conflito de HTML entre servidor e
 * cliente, já que o script do Google altera a tag <ins>) e some sozinho se o
 * anúncio não for preenchido — assim nunca sobra espaço em branco na tela.
 */
export function AdSenseUnit({ className, onUnavailable }: Props) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [filled, setFilled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // AdSense só é servido em domínios aprovados na sua conta. Em preview /
    // localhost o Google devolve espaço vazio, então nem carregamos o script.
    const host = window.location.hostname;
    const allowed = !/localhost|127\.0\.0\.1|lovableproject\.com|\.lovable\.app$/.test(host);
    if (!allowed) {
      onUnavailable?.();
      return;
    }
    setMounted(true);
  }, [onUnavailable]);

  useEffect(() => {
    if (!mounted || pushed.current) return;
    pushed.current = true;
    let alive = true;
    let observer: MutationObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fail = () => {
      if (!alive) return;
      setHidden(true);
      onUnavailable?.();
    };

    void loadAdSenseScript().then((ok) => {
      if (!alive) return;
      const el = ref.current;
      if (!ok || !el) return fail();
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
      } catch {
        return fail();
      }

      const check = () => {
        const status = el.getAttribute("data-ad-status");
        // Só consideramos preenchido quando o Google confirma E existe criativo.
        const iframe = el.querySelector("iframe");
        if (status === "filled" && iframe && iframe.clientHeight > 30) {
          setFilled(true);
          return true;
        }
        if (status === "unfilled") {
          fail();
          return true;
        }
        return false;
      };

      if (check()) return;
      observer = new MutationObserver(() => {
        if (check()) observer?.disconnect();
      });
      observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status", "style"] });
      // Sem resposta do Google (bloqueador de anúncios, rede): remove o espaço.
      timer = setTimeout(() => {
        if (!check()) fail();
      }, 4000);
    });

    return () => {
      alive = false;
      observer?.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [mounted, onUnavailable]);

  if (!mounted || hidden || !ADSENSE.client || !ADSENSE.slot) return null;

  return (
    <ins
      ref={ref}
      className={"adsbygoogle block " + (className ?? "")}
      // Sem altura mínima antes de preencher → zero espaço em branco.
      style={{ display: "block", width: "100%", minHeight: filled ? 60 : 0 }}
      data-ad-client={ADSENSE.client}
      data-ad-slot={ADSENSE.slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
