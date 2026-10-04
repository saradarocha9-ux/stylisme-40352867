import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Assinatura ausente", { status: 401 });
    const body = await request.text();
    const secret = process.env['STRIPE_WEBHOOK_SECRET'];
    const key = process.env['STRIPE_SECRET_KEY'];
    if (!secret || !key) return new Response("Webhook não configurado", { status: 503 });
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key);
    let event: { id: string; type: string; data: { object: unknown } };
    try { event = await stripe.webhooks.constructEventAsync(body, signature, secret); }
    catch { return new Response("Assinatura inválida", { status: 401 }); }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payloadHash = createHash("sha256").update(body).digest("hex");
    const existing = await supabaseAdmin.from("subscription_events").select("provider_event_id").eq("provider_event_id", event.id).maybeSingle();
    if (existing.data) return new Response("ok");
    if (existing.error) return new Response("Falha de consulta", { status: 500 });
    const object = event.data.object as { customer?: string | { id?: string }; status?: string; metadata?: { user_id?: string; kind?: string; store_id?: string; tier?: string }; id?: string; items?: { data?: { current_period_end?: number }[] } };
    const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
    let userId = object.metadata?.user_id;
    if (!userId && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted) userId = customer.metadata.user_id;
      } catch (error) {
        console.error("[stripe-webhook] cliente não encontrado", customerId, error);
      }
    }
    const isStorePlan = object.metadata?.kind === "store_partner";
    if (isStorePlan && object.metadata?.store_id && event.type.startsWith("customer.subscription.")) {
      const live = ["active","trialing"].includes(object.status ?? "");
      const end = object.items?.data?.[0]?.current_period_end;
      const upd = await supabaseAdmin.from("stores").update(live && end ? { partner_tier: object.metadata.tier ?? null, partner_until: new Date(end * 1000).toISOString(), partner_subscription_id: object.id ?? null } : { partner_until: new Date().toISOString() }).eq("id", object.metadata.store_id);
      if (upd.error) return new Response("Falha ao atualizar loja", { status: 500 });
    }
    if (!isStorePlan && userId && event.type.startsWith("customer.subscription.")) {
      const premium = ["active","trialing"].includes(object.status ?? "");
      const updated = await supabaseAdmin.from("profiles").update({ plan: premium ? "premium" : "free" }).eq("id", userId);
      if (updated.error) return new Response("Falha ao atualizar assinatura", { status: 500 });
    }
    const inserted = await supabaseAdmin.from("subscription_events").insert({ provider_event_id:event.id,event_type:event.type,payload_hash:payloadHash,user_id:userId??null });
    if (inserted.error && inserted.error.code !== "23505") return new Response("Falha de registro", { status: 500 });
    return new Response("ok");
  } } },
});
