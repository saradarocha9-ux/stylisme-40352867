import { supabase } from "@/integrations/supabase/client";

export interface CloudProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  link: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  plan: string;
}

interface Row {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  link: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  plan: string;
}

const COLUMNS = "id, name, username, bio, link, avatar_url, banner_url, plan";

/** Resolve a stored value (full URL or storage path) into a usable image URL. */
export async function resolveImage(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(value, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

async function hydrate(row: Row): Promise<CloudProfile> {
  const [avatarUrl, bannerUrl] = await Promise.all([
    resolveImage(row.avatar_url),
    resolveImage(row.banner_url),
  ]);
  return {
    id: row.id,
    name: row.name || "Stylisme",
    username: row.username ?? "",
    bio: row.bio ?? "",
    link: row.link ?? "",
    avatarUrl,
    bannerUrl,
    plan: row.plan,
  };
}

/** Public-safe profile of any user (excludes private fields like plan). */
export async function getProfile(userId: string): Promise<CloudProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.id === userId) return getOwnProfile(userId);
  const { data, error } = await supabase.rpc("get_public_profile", { _user_id: userId });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return hydrate({ ...(row as Omit<Row, "plan">), plan: "free" } as Row);
}

async function getOwnProfile(userId: string): Promise<CloudProfile | null> {
  const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return hydrate(data as unknown as Row);
}

export async function getMyProfile(): Promise<CloudProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return null;
  const existing = await getProfile(me);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: me, name: auth.user?.email?.split("@")[0] ?? "Stylisme" })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return hydrate(data as unknown as Row);
}

/** Upload a profile image (avatar or banner) and return its storage path. */
export async function uploadProfileImage(file: Blob, kind: "avatar" | "banner"): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Entre na sua conta.");
  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const path = `${me}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function saveProfile(patch: {
  name?: string;
  username?: string;
  bio?: string;
  link?: string;
  avatar_url?: string | null;
  banner_url?: string | null;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error("Entre na sua conta.");
  const clean = { ...patch };
  if (clean.username !== undefined) {
    const u = clean.username.trim().replace(/^@/, "").toLowerCase();
    clean.username = u || undefined;
    if (u && !/^[a-z0-9._]{3,20}$/.test(u)) {
      throw new Error("Apelido: 3 a 20 caracteres, use letras, números, ponto ou _.");
    }
  }
  const { error } = await supabase.from("profiles").update(clean).eq("id", me);
  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      throw new Error("Esse apelido já está em uso.");
    }
    throw new Error(error.message);
  }
  // Mantém os looks já publicados com o nome/foto atualizados.
  if (patch.name !== undefined || patch.avatar_url !== undefined) {
    const avatar = patch.avatar_url !== undefined ? await resolveImage(patch.avatar_url) : undefined;
    const postPatch: { author_name?: string; author_avatar?: string | null } = {};
    if (patch.name !== undefined) postPatch.author_name = patch.name;
    if (avatar !== undefined) postPatch.author_avatar = avatar;
    await supabase.from("look_posts").update(postPatch).eq("user_id", me);
  }
}
