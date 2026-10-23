import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) return new Response("Assinatura ausente", { status: 401 });
    const maximum = 1024 * 1024;
    if (Number(request.headers.get("content-length")) > maximum) return new Response("Pedido muito grande", { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) return new Response("Pedido vazio", { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > maximum) { await reader.cancel(); return new Response("Pedido muito grande", { status: 413 }); }
        chunks.push(part.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = new TextDecoder().decode(bytes);
    const secret = process.env['STRIPE_WEBHOOK_SECRET'];
    const key = process.env['STRIPE_SECRET_KEY'];
    if (!secret || !key) return new Response("Webhook não configurado", { status: 503 });
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key, { timeout: 20_000, maxNetworkRetries: 1 });
    let event: { id: string; type: string; created: number; data: { object: unknown } };
    try { event = await stripe.webhooks.constructEventAsync(body, signature, secret); }
    catch { return new Response("Assinatura inválida", { status: 401 }); }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payloadHash = createHash("sha256").update(body).digest("hex");
    const existing = await supabaseAdmin.from("subscription_events").select("provider_event_id").eq("provider_event_id", event.id).maybeSingle();
    if (existing.data) return new Response("ok");
    if (existing.error) return new Response("Falha de consulta", { status: 500 });
    if (!event.type.startsWith("customer.subscription.")) return new Response("ok");
    let object = event.data.object as { customer?: string | { id?: string }; status?: string; metadata?: { user_id?: string; kind?: string; store_id?: string; tier?: string }; id?: string; items?: { data?: { current_period_end?: number }[] } };
    if (!object.id) return new Response("Assinatura ausente", { status: 400 });
    // Reconcile authoritative state, rather than replaying an old event's snapshot.
    try { object = await stripe.subscriptions.retrieve(object.id); }
    catch { return new Response("Não foi possível conferir a assinatura", { status: 503 }); }
    const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
    let userId = object.metadata?.user_id;
    if (!userId && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted) userId = customer.metadata.user_id;
      } catch { return new Response("Não foi possível conferir o cliente", { status: 503 }); }
    }
    const isStorePlan = object.metadata?.kind === "store_partner";
    const storeId = isStorePlan ? object.metadata?.store_id : undefined;
    if ((isStorePlan && !storeId) || (!isStorePlan && !userId)) return new Response("Responsável pela assinatura ausente", { status: 422 });
    const live = ["active", "trialing"].includes(object.status ?? "");
    const end = object.items?.data?.[0]?.current_period_end;
    if (isStorePlan && live && !end) return new Response("Vigência ausente", { status: 503 });
    // Generated RPC types omit PostgreSQL argument nullability; SQL explicitly accepts null for the unused entity.
    const args = {
      _event_id: event.id, _event_type: event.type, _payload_hash: payloadHash, _event_created: event.created,
      _user_id: userId ?? null, _store_id: storeId ?? null, _premium: live,
      _tier: object.metadata?.tier ?? null, _until: end ? new Date(end * 1000).toISOString() : null,
      _subscription_id: object.id ?? null,
    } as unknown as Database["public"]["Functions"]["apply_subscription_event"]["Args"];
    const applied = await supabaseAdmin.rpc("apply_subscription_event", args);
    if (applied.error) return new Response("Falha ao registrar assinatura", { status: 500 });
    return new Response("ok");
  } } },
});
