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
    const inserted = await supabaseAdmin.from("subscription_events").insert({ provider_event_id:event.id,event_type:event.type,payload_hash:payloadHash }).select("provider_event_id").maybeSingle();
    if (inserted.error?.code === "23505") return new Response("ok");
    if (inserted.error) return new Response("Falha de registro", { status: 500 });
    const object = event.data.object as { customer?: string | { id?: string }; status?: string; metadata?: { user_id?: string } };
    const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
    let userId = object.metadata?.user_id;
    if (!userId && customerId) { const customer = await stripe.customers.retrieve(customerId); if (!customer.deleted) userId = customer.metadata.user_id; }
    if (userId && event.type.startsWith("customer.subscription.")) {
      const premium = ["active","trialing"].includes(object.status ?? "");
      await supabaseAdmin.from("profiles").update({ plan: premium ? "premium" : "free" }).eq("id", userId);
      await supabaseAdmin.from("subscription_events").update({ user_id:userId }).eq("provider_event_id",event.id);
    }
    return new Response("ok");
  } } },
});
