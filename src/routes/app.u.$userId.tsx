import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listUserPosts, timeAgo, type FeedPost } from "@/lib/community";

export const Route = createFileRoute("/app/u/$userId")({
  head: () => ({
    meta: [
      { title: "Perfil da comunidade | Stylisme" },
      { name: "description", content: "Veja todos os looks criados por esta pessoa no Stylisme." },
      { property: "og:title", content: "Perfil da comunidade | Stylisme" },
      { property: "og:description", content: "Veja todos os looks criados por esta pessoa no Stylisme." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const [list, { data: auth }] = await Promise.all([listUserPosts(userId), supabase.auth.getUser()]);
        if (!alive) return;
        setPosts(list);
        setMe(auth.user?.id ?? null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não consegui carregar o perfil.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const isMe = me === userId;
  const author = posts[0];
  const likes = posts.reduce((sum, p) => sum + p.likes, 0);

  return (
    <div className="px-5 pt-8">
      <Link to="/app/feed" className="press flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <ArrowLeft size={16} /> Feed
      </Link>

      <div className="mt-4 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-soft">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
          {author?.authorAvatar && <img src={author.authorAvatar} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-2xl">{isMe ? "Meus looks" : author?.authorName ?? "Stylisme"}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {posts.length} look{posts.length === 1 ? "" : "s"} · {likes} curtida{likes === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {isMe && (
        <Link
          to="/app/looks"
          className="press-gold mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground"
        >
          <Plus size={14} /> Criar look
        </Link>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
      ) : posts.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          {isMe ? "Você ainda não publicou nenhum look." : "Esta pessoa ainda não publicou looks."}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              to="/app/look/$postId"
              params={{ postId: p.id }}
              className="animate-rise overflow-hidden rounded-3xl bg-card shadow-soft"
            >
              <div className="aspect-[3/4] w-full bg-muted">
                {p.imageUrl && <img src={p.imageUrl} alt={`Look ${p.title}`} loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart size={12} /> {p.likes}</span>
                  <span>{timeAgo(p.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
