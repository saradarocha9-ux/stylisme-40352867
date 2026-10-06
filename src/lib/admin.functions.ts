import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(context: { supabase: any; userId: string }, moderation = false) {
  const roles = moderation ? ["admin", "moderator"] as const : ["admin"] as const;
  for (const role of roles) {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: role });
    if (data) return;
  }
  throw new Error("Acesso administrativo necessário.");
}

export const getAdminOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await ensureAdmin(context, true);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [stores, campaigns, reports, users, events] = await Promise.all([
    supabaseAdmin.from("stores").select("*").in("status", ["pending", "rejected"]),
    supabaseAdmin.from("store_campaigns").select("*, stores(name)").in("status", ["submitted", "under_review"]),
    supabaseAdmin.from("content_reports").select("*, look_posts(title)").in("status", ["open", "under_review"]),
    supabaseAdmin.from("profiles").select("id, plan, joined_at"),
    supabaseAdmin.from("campaign_events").select("kind, created_at"),
  ]);
  return { stores: stores.data ?? [], campaigns: campaigns.data ?? [], reports: reports.data ?? [], users: users.data ?? [], events: events.data ?? [] };
});

export const moderateEntity = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "store" | "campaign" | "report"; id: string; decision: string; reason?: string; postId?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let operationError: { message: string } | null = null;
    if (data.kind === "store") operationError = (await supabaseAdmin.from("stores").update(data.decision === "approve" ? { status: "verified", verified_at: new Date().toISOString(), rejection_reason: null } : { status: "rejected", rejection_reason: data.reason || "Revisão necessária" }).eq("id", data.id)).error;
    if (data.kind === "campaign") operationError = (await supabaseAdmin.from("store_campaigns").update(data.decision === "approve" ? { status: "approved", approved_at: new Date().toISOString(), approved_by: context.userId, rejection_reason: null } : { status: "rejected", rejection_reason: data.reason || "Revisão necessária" }).eq("id", data.id)).error;
    if (data.kind === "report") {
      if (data.decision === "suspend" && data.postId) operationError = (await supabaseAdmin.from("look_posts").update({ suspended_at: new Date().toISOString(), suspension_reason: data.reason || "Conteúdo em revisão" }).eq("id", data.postId)).error;
      if (!operationError) operationError = (await supabaseAdmin.from("content_reports").update({ status: "resolved", resolution_note: data.reason || data.decision, reviewed_by: context.userId, reviewed_at: new Date().toISOString() }).eq("id", data.id)).error;
    }
    if (operationError) throw new Error(operationError.message);
    const audit = await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, action: data.decision, entity_type: data.kind, entity_id: data.id, metadata: { reason: data.reason ?? "" } });
    if (audit.error) throw new Error(audit.error.message);
    return { ok: true };
  });

export const getCreatorStats = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await ensureAdmin(context, true);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const head = { count: "exact" as const, head: true };
  const [users, premium, newUsers, posts, postsWeek, stores, verified, usage] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", head),
    supabaseAdmin.from("profiles").select("id", head).eq("plan", "premium"),
    supabaseAdmin.from("profiles").select("id", head).gte("joined_at", since7),
    supabaseAdmin.from("look_posts").select("id", head),
    supabaseAdmin.from("look_posts").select("id", head).gte("created_at", since7),
    supabaseAdmin.from("stores").select("id", head),
    supabaseAdmin.from("stores").select("id", head).eq("status", "verified"),
    supabaseAdmin.from("daily_usage").select("kind, used").eq("usage_date", today),
  ]);
  const ai = (usage.data ?? []).reduce((s: number, r: any) => s + (r.used ?? 0), 0);
  return { users: users.count ?? 0, premium: premium.count ?? 0, newUsers: newUsers.count ?? 0, posts: posts.count ?? 0, postsWeek: postsWeek.count ?? 0, stores: stores.count ?? 0, verifiedStores: verified.count ?? 0, aiToday: ai };
});

export const listAllPosts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await ensureAdmin(context, true);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("look_posts").select("id, title, author_name, user_id, image_path, likes_count, created_at, suspended_at, is_editorial").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const paths = (data ?? []).map((p) => p.image_path);
  const signed = paths.length ? (await supabaseAdmin.storage.from("looks").createSignedUrls(paths, 3600)).data ?? [] : [];
  return (data ?? []).map((p, i) => ({ ...p, image_url: signed[i]?.signedUrl ?? null }));
});

export const adminDeletePost = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post } = await supabaseAdmin.from("look_posts").select("image_path").eq("id", data.id).maybeSingle();
    if (!post) throw new Error("Publicação não encontrada.");
    await supabaseAdmin.from("content_reports").delete().eq("post_id", data.id);
    await supabaseAdmin.from("look_likes").delete().eq("post_id", data.id);
    await supabaseAdmin.from("saved_inspirations").delete().eq("post_id", data.id);
    const { error } = await supabaseAdmin.from("look_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.storage.from("looks").remove([post.image_path]);
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, action: "delete", entity_type: "post", entity_id: data.id, metadata: { reason: data.reason ?? "" } });
    return { ok: true };
  });

export const listAdminStores = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await ensureAdmin(context, true);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("stores").select("id, name, slug, status, logo_path, created_at").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const paths = (data ?? []).map((s) => s.logo_path).filter(Boolean) as string[];
  const signed = paths.length ? (await supabaseAdmin.storage.from("store-assets").createSignedUrls(paths, 3600)).data ?? [] : [];
  const urlByPath = new Map(signed.map((s, i) => [paths[i], s?.signedUrl ?? null]));
  return (data ?? []).map((s) => ({ ...s, logo_url: s.logo_path ? urlByPath.get(s.logo_path) ?? null : null }));
});

export const adminDeleteStore = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store } = await supabaseAdmin.from("stores").select("id, name, logo_path, banner_path").eq("id", data.id).maybeSingle();
    if (!store) throw new Error("Loja não encontrada.");
    const { data: products } = await supabaseAdmin.from("store_products").select("image_path").eq("store_id", data.id);
    const { data: campaigns } = await supabaseAdmin.from("store_campaigns").select("id, image_path").eq("store_id", data.id);
    const campaignIds = (campaigns ?? []).map((c) => c.id);
    if (campaignIds.length) await supabaseAdmin.from("campaign_events").delete().in("campaign_id", campaignIds);
    await supabaseAdmin.from("store_events").delete().eq("store_id", data.id);
    await supabaseAdmin.from("store_campaigns").delete().eq("store_id", data.id);
    await supabaseAdmin.from("store_products").delete().eq("store_id", data.id);
    await supabaseAdmin.from("store_members").delete().eq("store_id", data.id);
    const { error } = await supabaseAdmin.from("stores").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const files = [store.logo_path, store.banner_path, ...(products ?? []).map((p) => p.image_path), ...(campaigns ?? []).map((c) => c.image_path)].filter(Boolean) as string[];
    if (files.length) await supabaseAdmin.storage.from("store-assets").remove(files);
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, action: "delete", entity_type: "store", entity_id: data.id, metadata: { name: store.name, reason: data.reason ?? "" } });
    return { ok: true };
  });

export const listAdminUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context, true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (error) throw new Error(error.message);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, name, username, plan, joined_at");
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    const q = (data.q ?? "").trim().toLowerCase();
    return list.users.map((u) => {
      const p: any = byId.get(u.id);
      return { id: u.id, email: u.email ?? "", name: p?.name ?? "", username: p?.username ?? null, plan: p?.plan ?? "free", joined_at: p?.joined_at ?? u.created_at };
    }).filter((u) => !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || (u.username ?? "").toLowerCase().includes(q))
      .sort((a, b) => (a.joined_at < b.joined_at ? 1 : -1)).slice(0, 100);
  });
