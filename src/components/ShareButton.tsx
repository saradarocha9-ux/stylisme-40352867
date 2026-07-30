import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { renderPaletteCard, renderLookCard, shareBlob } from "@/lib/share-card";
import type { ColorAnalysis } from "@/lib/color-ai.functions";
import { tap } from "@/lib/haptics";
import { track } from "@/lib/track";

type Props =
  | { kind: "palette"; analysis: ColorAnalysis; className?: string; label?: string }
  | { kind: "look"; title: string; subtitle?: string; images: string[]; className?: string; label?: string };

export function ShareButton(props: Props) {
  const [busy, setBusy] = useState(false);

  async function go() {
    tap();
    setBusy(true);
    try {
      const blob =
        props.kind === "palette"
          ? await renderPaletteCard(props.analysis)
          : await renderLookCard({ title: props.title, subtitle: props.subtitle, images: props.images });
      const text =
        props.kind === "palette"
          ? `Descobri minha cartela de cores: ${props.analysis.season} ✨ Faça a sua no Stylisme.`
          : `Meu look de hoje pelo Stylisme ✨`;
      const res = await shareBlob(blob, "stylisme.png", text);
      track("share");
      toast.success(res === "shared" ? "Pronto para postar!" : "Card salvo na galeria/downloads");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui gerar o card");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className={
        "press inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-primary-foreground shadow-lift disabled:opacity-60 " +
        (props.className ?? "")
      }
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} strokeWidth={1.6} />}
      {props.label ?? "Compartilhar"}
    </button>
  );
}
