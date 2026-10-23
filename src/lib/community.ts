import { supabase } from "@/integrations/supabase/client";
import { displayPostLikes } from "@/lib/official";


export const FEED_CATEGORIES = [
  { id: "geral", label: "Geral" },
  { id: "dia-a-dia", label: "Dia a dia" },
  { id: "trabalho", label: "Trabalho" },
  { id: "festa", label: "Festa" },
  { id: "praia", label: "Praia" },
  { id: "academia", label: "Academia" },
  { id: "pets", label: "Pets" },
  { id: "inverno", label: "Inverno" },
  { id: "alternativo", label: "Alternativo" },
] as const;

export type FeedSort = "populares" | "recentes" | "seguindo";

export interface PostGarment {
  name: string;
  category: string;
  color: string;
  material?: string;
  pattern?: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  caption: string;
  category: string;
  imageUrl: string;
  garments: PostGarment[];
  /** Curtidas reais exibidas. */
  likes: number;
  /** Curtidas reais gravadas no banco — base de todo cálculo. */
  realLikes: number;
  likedByMe: boolean;

  createdAt: string;
}

interface Row {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  title: string;
  caption: string;
  category: string;
  image_path: string;
  garments: unknown;
  likes_count: number;
  created_at: string;
}

async function withSignedUrls(rows: Row[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const paths = [...new Set(rows.map((r) => r.image_path))];
  if (paths.length === 0) return map;
  const { data } = await supabase.storage.from("looks").createSignedUrls(paths, 60 * 60);
  (data ?? []).forEach((s) => {
    if (s.path && s.signedUrl) map.set(s.path, s.signedUrl);
  });
  return map;
}

async function hydrate(rows: Row[]): Promise<FeedPost[]> {
  const [urls, { data: auth }] = await Promise.all([withSignedUrls(rows), supabase.auth.getUser()]);
  const me = auth.user?.id;
  let liked = new Set<string>();
  if (me && rows.length) {
    const { data } = await supabase
      .from("look_likes")
      .select("post_id")
      .eq("user_id", me)
      .in("post_id", rows.map((r) => r.id));
    liked = new Set((data ?? []).map((l) => l.post_id as string));
  }
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    authorName: r.author_name || "Stylisme",
    authorAvatar: r.author_avatar,
    title: r.title,
    caption: r.caption,
    category: r.category,
    imageUrl: urls.get(r.image_path) ?? "",
    garments: Array.isArray(r.garments) ? (r.garments as PostGarment[]) : [],
    likes: displayPostLikes(r.user_id, r.likes_count),
    realLikes: Math.max(0, r.likes_count ?? 0),

    likedByMe: liked.has(r.id),
    createdAt: r.created_at,
  }));
}

const COLUMNS = "id, user_id, author_name, author_avatar, title, caption, category, image_path, garments, likes_count, created_at";

export function searchPattern(value: string) {
  return value.trim().replace(/^@/, "").replace(/[%_(),.\\]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

export interface CommunityUser { id: string; name: string; username: string | null }

export async function searchCommunityUsers(term: string): Promise<CommunityUser[]> {
  const text = searchPattern(term);
  if (!text) return [];
  const { data, error } = await supabase.from("public_profiles")
    .select("id, name, username")
    .or(`name.ilike.%${text}%,username.ilike.%${text}%`)
    .order("name").limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface FeedCursor { date: string; id: string; likes: number }
export async function listFeedPage(opts: { sort: FeedSort; category?: string; search?: string; cursor?: FeedCursor | null }) {
  const query = supabase.rpc("feed_page", {
    _sort: opts.sort, _category: opts.category ?? "todos", _search: searchPattern(opts.search ?? ""),
    _cursor_date: opts.cursor?.date, _cursor_id: opts.cursor?.id, _cursor_likes: opts.cursor?.likes, _limit: 25,
  });
  const [{ data, error }, dismissed] = await Promise.all([query, listDismissals()]);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).slice(0, 24) as unknown as Row[];
  const last = rows.at(-1);
  const cursor: FeedCursor | null = (data?.length ?? 0) > 24 && last ? { date: last.created_at, id: last.id, likes: last.likes_count } : null;
  const hidden = new Set(dismissed.map((d) => d.post_id));
  const catCount = new Map<string, number>();
  for (const d of dismissed) catCount.set(d.category, (catCount.get(d.category) ?? 0) + 1);
  const posts = (await hydrate(rows)).filter((p) => !hidden.has(p.id));
  // Ordena exclusivamente pelas curtidas reais.
  if (opts.sort === "populares") posts.sort((a, b) => b.likes - a.likes);
  // Estilos marcados como "não tenho interesse" 2+ vezes descem no feed.
  const disliked = (p: FeedPost) => ((catCount.get(p.category) ?? 0) >= 2 ? 1 : 0);
  return { posts: posts.map((p, i) => ({ p, i })).sort((a, b) => disliked(a.p) - disliked(b.p) || a.i - b.i).map((x) => x.p), cursor };
}

export async function listFeed(opts: { sort: FeedSort; category?: string; search?: string }) {
  return (await listFeedPage(opts)).posts;
}

async function listDismissals(): Promise<{ post_id: string; category: string }[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data } = await supabase.from("look_dismissals").select("post_id,category").eq("user_id", auth.user.id).limit(1000);
  return data ?? [];
}

export async function dismissLook(postId: string, category: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta.");
  const { error } = await supabase.from("look_dismissals").upsert({ user_id: auth.user.id, post_id: postId, category });
  if (error) throw new Error(error.message);
}

export async function undoDismissLook(postId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("look_dismissals").delete().eq("user_id", auth.user.id).eq("post_id", postId);
}

export async function listUserPosts(userId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("look_posts")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return hydrate((data ?? []) as unknown as Row[]);
}

export async function getPost(id: string): Promise<FeedPost | null> {
  const { data, error } = await supabase.from("look_posts").select(COLUMNS).eq("id", id).is("suspended_at", null).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return (await hydrate([data as unknown as Row]))[0] ?? null;
}

export async function toggleLike(postId: string, liked: boolean) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Entre na sua conta para curtir.");
  if (liked) {
    const { error } = await supabase.from("look_likes").delete().eq("post_id", postId).eq("user_id", me);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("look_likes").insert({ post_id: postId, user_id: me });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  }
}

/**
 * Atualização otimista de curtida: mexe só na contagem REAL e recalcula a
 * exibida. Evita que o piso da conta oficial seja somado/desfeito por engano.
 */
export function applyLikeToggle(post: FeedPost): FeedPost {
  const realLikes = Math.max(0, post.realLikes + (post.likedByMe ? -1 : 1));
  return {
    ...post,
    likedByMe: !post.likedByMe,
    realLikes,
    likes: displayPostLikes(post.userId, realLikes),
  };
}


async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function publishLook(input: {
  imageDataUrl: string;
  title: string;
  caption: string;
  category: string;
  garments: PostGarment[];
  authorName: string;
  authorAvatar?: string | null;
}): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Entre na sua conta para publicar.");

  const blob = await dataUrlToBlob(input.imageDataUrl);
  const path = `${me}/${crypto.randomUUID()}.${blob.type.includes("png") ? "png" : "jpg"}`;
  const up = await supabase.storage.from("looks").upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });
  if (up.error) throw new Error(up.error.message);

  const { data, error } = await supabase
    .from("look_posts")
    .insert({
      user_id: me,
      author_name: input.authorName || "Stylisme",
      author_avatar: input.authorAvatar ?? null,
      title: input.title,
      caption: input.caption,
      category: input.category,
      image_path: path,
      garments: input.garments as unknown as never,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function deletePost(post: FeedPost) {
  const { error } = await supabase.from("look_posts").delete().eq("id", post.id);
  if (error) throw new Error(error.message);
}

export async function saveInspiration(postId: string) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("Entre na sua conta para salvar.");
  const { error } = await supabase.from("saved_inspirations").insert({ user_id: userId, post_id: postId });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function reportPost(postId: string, reason: "spam" | "assédio" | "conteúdo impróprio" | "direitos autorais" | "outro", details = "") {
  const { data } = await supabase.auth.getUser();
  const reporterId = data.user?.id;
  if (!reporterId) throw new Error("Entre na sua conta para denunciar.");
  const { error } = await supabase.from("content_reports").insert({ reporter_id: reporterId, post_id: postId, reason, details });
  if (error?.code === "23505") throw new Error("Você já denunciou esta publicação.");
  if (error) throw new Error(error.message);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export const FREE_DAILY_POSTS = 3;

/** Quantos looks o usuário já publicou hoje (fuso local). */
export async function countMyPostsToday(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("look_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me)
    .gte("created_at", start.toISOString());
  return count ?? 0;
}

export async function listFollowingIds(): Promise<string[]> {
  const me = (await supabase.auth.getUser()).data.user?.id;
  if (!me) return [];
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", me);
  return (data ?? []).map((r) => r.following_id);
}

export async function getFollowInfo(userId: string) {
  const me = (await supabase.auth.getUser()).data.user?.id ?? null;
  const [counts, mine] = await Promise.all([
    supabase.rpc("get_follow_counts", { _user_id: userId }),
    me ? supabase.from("follows").select("following_id").eq("follower_id", me).eq("following_id", userId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const row = counts.data?.[0];
  return { followers: row?.followers ?? 0, following: row?.following ?? 0, isFollowing: !!mine.data };
}

export async function setFollow(userId: string, follow: boolean) {
  const me = (await supabase.auth.getUser()).data.user?.id;
  if (!me) throw new Error("Entre na sua conta para seguir.");
  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: me, following_id: userId })
    : await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", userId);
  if (error && error.code !== "23505") throw new Error(error.message);
}
