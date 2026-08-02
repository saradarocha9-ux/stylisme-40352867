import { useEffect, useState } from "react";
import { X, Loader2, Upload, Crown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { FEED_CATEGORIES, publishLook, countMyPostsToday, FREE_DAILY_POSTS, type PostGarment } from "@/lib/community";
import { useSubscription } from "@/hooks/use-subscription";
import { Link } from "@tanstack/react-router";
import { resizeDataUrl } from "@/lib/image-resize";
import { tap } from "@/lib/haptics";
import { track } from "@/lib/track";

export function PublishLookSheet({
  imageDataUrl,
  garments,
  authorName,
  authorAvatar,
  onClose,
}: {
  imageDataUrl: string;
  garments: PostGarment[];
  authorName: string;
  authorAvatar?: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("geral");
  const [busy, setBusy] = useState(false);
  const { isPremium } = useSubscription();
  const [usedToday, setUsedToday] = useState<number | null>(null);

  useEffect(() => {
    if (isPremium) return;
    void countMyPostsToday().then(setUsedToday);
  }, [isPremium]);

  const remaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_POSTS - (usedToday ?? 0));
  const blocked = !isPremium && usedToday !== null && remaining <= 0;

  async function submit() {
    if (!title.trim()) {
      toast.error("Dê um nome ao seu look.");
      return;
    }
    if (!isPremium) {
      const used = await countMyPostsToday();
      setUsedToday(used);
      if (used >= FREE_DAILY_POSTS) {
        toast.error(`Limite diário do plano Free: ${FREE_DAILY_POSTS} looks por dia. Seja Premium para publicar sem limites.`);
        return;
      }
    }
    tap();
    setBusy(true);
    try {
      const image = await resizeDataUrl(imageDataUrl, 1080);
      const id = await publishLook({
        imageDataUrl: image,
        title: title.trim(),
        caption: caption.trim(),
        category,
        garments,
        authorName,
        authorAvatar: authorAvatar ?? null,
      });
      track("share");
      setUsedToday((n) => (n ?? 0) + 1);
      toast.success("Look publicado na comunidade!");
      onClose();
      navigate({ to: "/app/look/$postId", params: { postId: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui publicar o look.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in-slow sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 shadow-lift sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Publicar look</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted" aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-muted">
          <img src={imageDataUrl} alt="Prévia do look que será publicado" className="max-h-56 w-full object-contain" />
        </div>

        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nome do look</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="Ex.: Alfaiataria de segunda-feira"
          className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none"
        />

        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Legenda</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={220}
          rows={2}
          placeholder="Conte a inspiração do look…"
          className="mt-1 w-full resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none"
        />

        <label className="mt-4 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Categoria</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEED_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={
                "rounded-full px-3.5 py-1.5 text-[11px] transition " +
                (category === c.id ? "bg-gold/20 ring-1 ring-gold" : "bg-background text-muted-foreground border border-border")
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => void submit()}
          disabled={busy || blocked}
          className="press mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {busy ? "Publicando…" : "Publicar na comunidade"}
        </button>
        {isPremium ? (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-muted-foreground">
            <Crown size={10} className="text-gold" /> Premium · publicações ilimitadas
          </p>
        ) : blocked ? (
          <Link to="/app/premium" onClick={onClose} className="mt-2 block text-center text-[10px] text-muted-foreground underline">
            Limite diário atingido ({FREE_DAILY_POSTS}/{FREE_DAILY_POSTS}). Seja Premium para publicar sem limites.
          </Link>
        ) : (
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            {usedToday === null ? "Seu look ficará visível para toda a comunidade Stylisme." : `${remaining} de ${FREE_DAILY_POSTS} publicações restantes hoje.`}
          </p>
        )}
      </div>
    </div>
  );
}
