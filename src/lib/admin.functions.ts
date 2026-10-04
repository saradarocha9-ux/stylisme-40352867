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
