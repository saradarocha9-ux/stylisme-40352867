import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Flag, Heart, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listUserPosts, getFollowInfo, setFollow, timeAgo, type FeedPost } from "@/lib/community";
import { getProfile, type CloudProfile } from "@/lib/profile";

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
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<string | null>(null);
  const [follow, setFollowState] = useState({ followers: 0, following: 0, isFollowing: false });
  const [busyFollow, setBusyFollow] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const [list, prof, { data: auth }] = await Promise.all([
          listUserPosts(userId),
          getProfile(userId).catch(() => null),
          supabase.auth.getUser(),
        ]);
        if (!alive) return;
        setPosts(list);
        setProfile(prof);
        setMe(auth.user?.id ?? null);
        void getFollowInfo(userId).then((f) => alive && setFollowState(f));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não consegui carregar o perfil.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  const isMe = me === userId;
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  async function sendReport() {
    if (!me || !reason) return toast.error("Escolha um motivo.");
    const { error } = await supabase.from("user_reports").insert({ reporter_id: me, reported_user_id: userId, reason, details: details.trim().slice(0, 1000) });
    if (error) return toast.error("Não consegui enviar a denúncia.");
    toast.success("Denúncia enviada. Nossa equipe vai analisar.");
    setReporting(false); setReason(""); setDetails("");
  }
  async function toggleFollow() {
    setBusyFollow(true);
    const next = !follow.isFollowing;
    setFollowState((f) => ({ ...f, isFollowing: next, followers: f.followers + (next ? 1 : -1) }));
    try { await setFollow(userId, next); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não consegui atualizar."); setFollowState(await getFollowInfo(userId)); }
    finally { setBusyFollow(false); }
  }
  const author = posts[0];
  const likes = posts.reduce((sum, p) => sum + p.likes, 0);
  const name = profile?.name || author?.authorName || "Stylisme";
  const avatar = profile?.avatarUrl ?? author?.authorAvatar ?? null;

  return (
    <div className="px-5 pt-8">
      <Link to="/app/feed" className="press flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <ArrowLeft size={16} /> Feed
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-card shadow-soft">
        <div className="h-24 w-full bg-muted">
          {profile?.bannerUrl && <img src={profile.bannerUrl} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-9 h-16 w-16 overflow-hidden rounded-full border-4 border-card bg-muted">
            {avatar && <img src={avatar} alt="" className="h-full w-full object-cover" />}
          </div>
          <p className="mt-3 truncate font-display text-2xl">{name}</p>
          {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
          {profile?.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
          {profile?.link && (
            <a href={profile.link.startsWith("http") ? profile.link : `https://${profile.link}`} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs underline">
              {profile.link}
            </a>
          )}
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {posts.length} look{posts.length === 1 ? "" : "s"} · {follow.followers} seguidor{follow.followers === 1 ? "" : "es"} · {follow.following} seguindo · {likes} curtida{likes === 1 ? "" : "s"}
          </p>
          {!isMe && me && (
            <button
              onClick={() => void toggleFollow()}
              disabled={busyFollow}
              className={"press mt-4 w-full rounded-full py-3 text-xs uppercase tracking-[0.2em] " + (follow.isFollowing ? "border border-border" : "bg-foreground text-primary-foreground")}
            >
              {follow.isFollowing ? "Seguindo" : "Seguir"}
            </button>
          )}
          {!isMe && me && !reporting && (
            <button onClick={() => setReporting(true)} className="press mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Flag size={12} /> Denunciar usuário</button>
          )}
          {!isMe && me && reporting && (
            <div className="mt-4 space-y-2 rounded-2xl border border-border p-3">
              <p className="text-xs font-medium">Por que você quer denunciar este usuário?</p>
              <div className="flex flex-wrap gap-1.5">
                {["Perfil falso", "Assédio ou ofensa", "Conteúdo impróprio", "Spam ou golpe", "Outro"].map((r) => (
                  <button key={r} onClick={() => setReason(r)} className={"rounded-full border px-3 py-1 text-[11px] " + (reason === r ? "border-foreground bg-foreground text-primary-foreground" : "border-border")}>{r}</button>
                ))}
              </div>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Conte o que aconteceu (opcional)" className="h-20 w-full rounded-xl border border-border bg-background p-2 text-xs outline-none" />
              <div className="flex gap-2">
                <button onClick={() => void sendReport()} className="flex-1 rounded-full bg-destructive py-2 text-xs text-destructive-foreground">Enviar denúncia</button>
                <button onClick={() => setReporting(false)} className="flex-1 rounded-full border border-border py-2 text-xs">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMe && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/app/edit-profile"
            className="press flex items-center justify-center gap-2 rounded-full border border-border py-3 text-xs uppercase tracking-[0.2em]"
          >
            Editar perfil
          </Link>
          <Link
            to="/app/looks"
            className="press-gold flex items-center justify-center gap-2 rounded-full bg-foreground py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground"
          >
            <Plus size={14} /> Criar look
          </Link>
        </div>
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
