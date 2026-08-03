import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2, Search, Share2, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { applyLikeToggle, deletePost, getPost, timeAgo, toggleLike, type FeedPost } from "@/lib/community";
import { matchWardrobe, type WardrobeMatch } from "@/lib/wardrobe-match.functions";
import { useStore, actions } from "@/lib/store";
import { tap } from "@/lib/haptics";

export const Route = createFileRoute("/app/look/$postId")({
  head: () => ({
    meta: [
      { title: "Look da comunidade | Stylisme" },
      { name: "description", content: "Veja o look, curta, compartilhe e descubra se o seu armário tem peças parecidas." },
      { property: "og:title", content: "Look da comunidade | Stylisme" },
      { property: "og:description", content: "Veja o look, curta, compartilhe e descubra se o seu armário tem peças parecidas." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookPostPage,
});

function LookPostPage() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const { state } = useStore();
  const runMatch = useServerFn(matchWardrobe);
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [match, setMatch] = useState<WardrobeMatch | null>(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [p, { data: auth }] = await Promise.all([getPost(postId), supabase.auth.getUser()]);
        if (!alive) return;
        setPost(p);
        setMe(auth.user?.id ?? null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não consegui abrir o look.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [postId]);

  async function like() {
    if (!post) return;
    tap();
    setPost(applyLikeToggle(post));
    try {
      await toggleLike(post.id, post.likedByMe);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui curtir.");
    }
  }

  async function share() {
    if (!post) return;
    tap();
    const url = `${window.location.origin}/app/look/${post.id}`;
    const text = `Olha esse look no Stylisme: ${post.title}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Link copiado!");
      }
    } catch { /* cancelado */ }
  }

  async function compare() {
    if (!post) return;
    tap();
    if (state.garments.length === 0) {
      toast.error("Cadastre peças no seu armário primeiro.");
      return;
    }
    setMatching(true);
    try {
      const result = await runMatch({
        data: {
          lookTitle: post.title,
          lookGarments: post.garments,
          wardrobe: state.garments.map((g) => ({
            id: g.id,
            name: g.name,
            category: g.category,
            color: g.color,
            material: g.material,
            pattern: g.pattern,
          })),
        },
      });
      setMatch(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui comparar agora.");
    } finally {
      setMatching(false);
    }
  }

  function tryOnSimilar() {
    if (!match) return;
    const ids = match.matches.map((m) => m.garmentId).filter((id): id is string => !!id);
    if (ids.length === 0) return;
    actions.tryOnClear();
    ids.forEach((id) => actions.tryOnAdd(id));
    navigate({ to: "/app/looks" });
  }

  async function remove() {
    if (!post || !confirm("Apagar este look da comunidade?")) return;
    try {
      await deletePost(post);
      toast.success("Look removido.");
      navigate({ to: "/app/feed" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui remover.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-sm text-muted-foreground">Este look não está mais disponível.</p>
        <Link to="/app/feed" className="mt-4 inline-block rounded-full bg-foreground px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground">
          Voltar ao feed
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8">
      <div className="flex items-center justify-between">
        <Link to="/app/feed" className="press flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <ArrowLeft size={16} /> Feed
        </Link>
        {me === post.userId && (
          <button onClick={() => void remove()} className="press rounded-full p-2 text-destructive" aria-label="Apagar look">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <h1 className="mt-4 font-display text-3xl">{post.title}</h1>
      {post.caption && <p className="mt-1 text-sm text-muted-foreground">{post.caption}</p>}

      <Link
        to="/app/u/$userId"
        params={{ userId: post.userId }}
        className="mt-4 flex items-center gap-3 rounded-3xl bg-card p-3 shadow-soft"
      >
        <span className="h-10 w-10 overflow-hidden rounded-full bg-muted">
          {post.authorAvatar && <img src={post.authorAvatar} alt="" className="h-full w-full object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{post.authorName}</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Ver perfil · {timeAgo(post.createdAt)}
          </span>
        </span>
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-muted shadow-soft">
        {post.imageUrl && <img src={post.imageUrl} alt={`Look ${post.title}`} className="w-full object-cover" />}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => void like()}
          className={
            "press flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm " +
            (post.likedByMe ? "bg-destructive/10 text-destructive" : "bg-card text-foreground shadow-soft")
          }
        >
          <Heart size={16} className={post.likedByMe ? "fill-destructive" : ""} /> {post.likes}
        </button>
        <button onClick={() => void share()} className="press flex flex-1 items-center justify-center gap-2 rounded-full bg-card py-3 text-sm shadow-soft">
          <Share2 size={16} /> Compartilhar
        </button>
      </div>

      {post.garments.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Peças do look</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {post.garments.map((g, i) => (
              <span key={i} className="rounded-full bg-card px-3 py-1.5 text-[11px] shadow-soft">
                {g.name} · {g.color}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Comparação com o armário */}
      <div className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
        <p className="font-display text-xl">Veja se no seu armário tem peças parecidas</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A IA compara as peças deste look com as suas e mostra o que dá para recriar hoje mesmo.
        </p>
        <button
          onClick={() => void compare()}
          disabled={matching || post.garments.length === 0}
          className="press-gold mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm text-primary-foreground disabled:opacity-60"
        >
          {matching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {matching ? "Procurando no seu armário…" : "Procurar no meu armário"}
        </button>
        {post.garments.length === 0 && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Este look não tem peças descritas.</p>
        )}

        {match && (
          <div className="mt-5 space-y-3">
            {match.headline && <p className="text-sm">{match.headline}</p>}
            {match.matches.map((m, i) => {
              const g = state.garments.find((x) => x.id === m.garmentId);
              return (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-background p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {g?.imageUrl ? (
                      <img src={g.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground"><Shirt size={16} /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.lookPiece}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {g ? `${g.name} — ${m.reason}` : "Você ainda não tem algo parecido"}
                    </p>
                  </div>
                  <span
                    className={
                      "shrink-0 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] " +
                      (m.similarity >= 70 ? "bg-gold/20 text-foreground" : m.similarity >= 40 ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive")
                    }
                  >
                    {m.garmentId ? `${m.similarity}%` : "falta"}
                  </span>
                </div>
              );
            })}

            {match.missing.length > 0 && (
              <div className="rounded-2xl bg-background p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">O que falta</p>
                <ul className="mt-2 space-y-1">
                  {match.missing.map((m, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-medium">{m.piece}</span> — <span className="text-muted-foreground">{m.tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {match.matches.some((m) => m.garmentId) && (
              <button
                onClick={tryOnSimilar}
                className="press w-full rounded-full border border-border py-3 text-xs uppercase tracking-[0.2em]"
              >
                Provar com as minhas peças
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
