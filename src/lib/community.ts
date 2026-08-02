import { supabase } from "@/integrations/supabase/client";

export const FEED_CATEGORIES = [
  { id: "geral", label: "Geral" },
  { id: "dia-a-dia", label: "Dia a dia" },
  { id: "trabalho", label: "Trabalho" },
  { id: "festa", label: "Festa" },
  { id: "praia", label: "Praia" },
  { id: "academia", label: "Academia" },
  { id: "pets", label: "Pets" },
  { id: "inverno", label: "Inverno" },
] as const;

export type FeedSort = "populares" | "recentes";

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
  likes: number;
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
    likes: r.likes_count,
    likedByMe: liked.has(r.id),
    createdAt: r.created_at,
  }));
}

const COLUMNS = "id, user_id, author_name, author_avatar, title, caption, category, image_path, garments, likes_count, created_at";

export async function listFeed(opts: { sort: FeedSort; category?: string }): Promise<FeedPost[]> {
  let query = supabase.from("look_posts").select(COLUMNS).limit(60);
  query = opts.sort === "populares"
    ? query.order("likes_count", { ascending: false }).order("created_at", { ascending: false })
    : query.order("created_at", { ascending: false });
  if (opts.category && opts.category !== "todos") query = query.eq("category", opts.category);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return hydrate((data ?? []) as unknown as Row[]);
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
  const { data, error } = await supabase.from("look_posts").select(COLUMNS).eq("id", id).maybeSingle();
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
