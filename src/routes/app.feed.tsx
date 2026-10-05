import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Heart, Loader2, Plus, Sparkles, Search, X, User } from "lucide-react";
import { toast } from "sonner";
import { FEED_CATEGORIES, applyLikeToggle, listFeed, searchCommunityUsers, saveInspiration, timeAgo, toggleLike, type CommunityUser, type FeedPost, type FeedSort } from "@/lib/community";
import { tap } from "@/lib/haptics";
import { isOfficialUser } from "@/lib/official";
import { PartnerCampaignCard } from "@/components/PartnerCampaignCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/feed")({
  head: () => ({
    meta: [
      { title: "Inspire-se — comunidade Stylisme" },
      { name: "description", content: "Veja os looks mais populares da comunidade Stylisme, curta, compartilhe e descubra peças parecidas no seu armário." },
      { property: "og:title", content: "Inspire-se — comunidade Stylisme" },
      { property: "og:description", content: "Looks reais de pessoas reais: os mais populares, os mais recentes e por categoria." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/app/feed" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/app/feed" }],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [sort, setSort] = useState<FeedSort>("populares");
  const [category, setCategory] = useState("todos");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [nextPosts, nextUsers] = await Promise.all([
        listFeed({ sort, category, search }),
        search ? searchCommunityUsers(search) : Promise.resolve([]),
      ]);
      if (id !== requestId.current) return;
      setPosts(nextPosts);
      setUsers(nextUsers);
    } catch (e) {
      if (id !== requestId.current) return;
      setPosts([]);
      setUsers([]);
      toast.error(e instanceof Error ? e.message : "Não consegui carregar os looks.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [sort, category, search]);

  useEffect(() => { void load(); }, [load]);

  async function like(post: FeedPost) {
    tap();
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? applyLikeToggle(p) : p)),
    );
    try {
      await toggleLike(post.id, post.likedByMe);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui curtir.");
      void load();
    }
  }

  return (
    <div className="px-5 pt-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Comunidade</p>
          <h1 className="font-display text-3xl">Inspire-se</h1>
        </div>
        <Link
          to="/app/looks"
          className="press-gold flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground"
        >
          <Plus size={14} /> Ver no corpo
        </Link>
      </div>

      <div role="search" className="mt-5 flex min-h-12 items-center gap-3 rounded-lg border border-input bg-card px-3">
        <Search size={18} className="shrink-0 text-muted-foreground" />
        <input type="search" aria-label="Pesquisar usuários ou looks" placeholder="Pesquisar usuários ou looks" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80} className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
        {query && <Button variant="ghost" size="icon" aria-label="Limpar pesquisa" onClick={() => { setQuery(""); setSearch(""); }}><X /></Button>}
      </div>

      <div className="mt-5 flex gap-2">
        {(["populares", "recentes", "seguindo"] as FeedSort[]).map((s) => (
          <button
            key={s}
            onClick={() => { tap(); setSort(s); }}
            className={
              "flex-1 rounded-full py-2 text-[11px] uppercase tracking-[0.2em] transition " +
              (sort === s ? "bg-foreground text-primary-foreground" : "border border-border text-muted-foreground")
            }
          >
            {s === "populares" ? "Relevantes" : s === "recentes" ? "Recentes" : "Seguindo"}
          </button>
        ))}
      </div>

      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {[{ id: "todos", label: "Todos" }, ...FEED_CATEGORIES].map((c) => (
          <button
            key={c.id}
            onClick={() => { tap(); setCategory(c.id); }}
            className={
              "shrink-0 rounded-full px-3.5 py-1.5 text-[11px] transition " +
              (category === c.id ? "bg-gold/20 text-foreground ring-1 ring-gold" : "bg-card text-muted-foreground shadow-soft")
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {!loading && search && <section className="mt-5" aria-label="Usuários encontrados">
        <h2 className="text-sm font-medium">Usuários</h2>
        {users.length ? <div className="mt-2 divide-y divide-border">{users.map((user) => <Link key={user.id} to="/app/u/$userId" params={{ userId: user.id }} className="flex min-h-14 items-center gap-3 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"><User size={18} /></span>
          <span className="min-w-0"><span className="block truncate text-sm font-medium">{user.name}</span>{user.username && <span className="block truncate text-xs text-muted-foreground">@{user.username.replace(/^@/, "")}</span>}</span>
        </Link>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Nenhum usuário encontrado.</p>}
        <h2 className="mt-5 text-sm font-medium">Looks</h2>
      </section>}

      {loading ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="animate-spin" size={22} />
          <span className="text-[11px] uppercase tracking-[0.2em]">Carregando looks</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 px-6 text-center text-muted-foreground">
          <Sparkles size={26} strokeWidth={1.3} />
          <p className="text-sm">{search ? "Nenhum look encontrado nessa seleção." : "Ainda não há looks por aqui nessa seleção."}</p>
          {!search && <Link to="/app/looks" className="press-gold mt-1 rounded-full bg-foreground px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground">
            Criar o primeiro look
          </Link>}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {!search && <PartnerCampaignCard variant="horizontal" />}
          {posts.map((p) => (
            <article key={p.id} className="animate-rise overflow-hidden rounded-3xl bg-card shadow-soft">
              <Link to="/app/look/$postId" params={{ postId: p.id }} className="block">
                <div className="aspect-[3/4] w-full bg-muted">
                  {p.imageUrl && <img src={p.imageUrl} alt={`Look ${p.title}`} loading="lazy" className="h-full w-full object-cover" />}
                </div>
              </Link>
              <div className="p-3">
                <Link to="/app/look/$postId" params={{ postId: p.id }}>
                  <p className="truncate text-sm font-medium">{p.title}</p>
                </Link>
                {isOfficialUser(p.userId) && <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-gold">Editorial Stylisme</p>}
                 <div className="mt-1 flex items-center justify-between">
                  <Link
                    to="/app/u/$userId"
                    params={{ userId: p.userId }}
                    className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground"
                  >
                    <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-muted">
                      {p.authorAvatar && <img src={p.authorAvatar} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="truncate">{p.authorName}</span>
                  </Link>
                   <div className="flex items-center gap-2"><button onClick={() => void saveInspiration(p.id).then(() => toast.success("Inspiração salva.")).catch((e) => toast.error(e instanceof Error ? e.message : "Não consegui salvar."))} className="press" aria-label="Salvar inspiração"><Bookmark size={14} /></button><button onClick={() => void like(p)} className="press flex items-center gap-1 text-[11px]" aria-label="Curtir"><Heart size={14} className={p.likedByMe ? "fill-destructive text-destructive" : "text-muted-foreground"} />{p.likes}</button></div>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{timeAgo(p.createdAt)}</p>
                <Link to="/app/look/$postId" params={{ postId: p.id }} className="mt-2 flex items-center gap-1 text-[10px] font-medium text-foreground">
                  <Search size={11} /> Procurar no meu armário
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
