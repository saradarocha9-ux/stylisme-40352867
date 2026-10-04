import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PARTNER_PLANS, type PartnerTier } from "@/lib/partner-plans";

async function getStripe() {
  const key = process.env['STRIPE_SECRET_KEY'];
  if (!key) throw new Error("Pagamento indisponível no momento.");
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-08-27.basil" as never });
}

function origin() {
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  return host ? `${proto}://${host}` : "https://stylisme.company";
}

async function ensureMember(context: { supabase: any }, storeId: string) {
  const { data } = await context.supabase.rpc("is_store_member", { _store_id: storeId });
  if (!data) throw new Error("Você não faz parte da equipe desta loja.");
}

export const createPartnerCheckout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { storeId: string; tier: PartnerTier }) => {
    if (!PARTNER_PLANS[d.tier]) throw new Error("Plano inválido.");
    return d;
  })
  .handler(async ({ data, context }) => {
    await ensureMember(context, data.storeId);
    const { data: store } = await context.supabase.from("stores").select("id,status,partner_until").eq("id", data.storeId).maybeSingle();
    if (!store || store.status !== "verified") throw new Error("A loja precisa estar aprovada antes do pagamento.");
    if (store.partner_until && new Date(store.partner_until) > new Date()) throw new Error("Esta loja já tem um plano ativo.");
    const email = typeof context.claims.email === "string" ? context.claims.email : undefined;
    const stripe = await getStripe();
    const meta = { kind: "store_partner", store_id: data.storeId, tier: data.tier, user_id: context.userId };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: PARTNER_PLANS[data.tier].priceId, quantity: 1 }],
      metadata: meta,
      subscription_data: { metadata: meta },
      success_url: `${origin()}/app/store-portal?partner_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin()}/app/store-portal?partner=cancelled`,
    });
    return { url: session.url };
  });

/** Confere no Stripe se a loja tem plano de parceiro pago e atualiza a loja. */
export const syncPartnerPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: { storeId: string; sessionId?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureMember(context, data.storeId);
    const stripe = await getStripe();
    let sub: any = null;
    if (data.sessionId) {
      const s = await stripe.checkout.sessions.retrieve(data.sessionId, { expand: ["subscription"] });
      if (s.metadata?.store_id === data.storeId && s.subscription && typeof s.subscription !== "string") sub = s.subscription;
    }
    if (!sub) {
      const found = await stripe.subscriptions.search({ query: `metadata['store_id']:'${data.storeId.replace(/[^a-f0-9-]/gi, "")}'`, limit: 10 });
      sub = found.data.find((x) => ["active", "trialing"].includes(x.status)) ?? null;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!sub || !["active", "trialing"].includes(sub.status)) {
      const { data: store } = await supabaseAdmin.from("stores").select("partner_tier,partner_until").eq("id", data.storeId).maybeSingle();
      return { tier: store?.partner_tier ?? null, until: store?.partner_until ?? null };
    }
    const end = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
    const until = new Date(end * 1000).toISOString();
    const tier = sub.metadata?.tier as PartnerTier;
    await supabaseAdmin.from("stores").update({ partner_tier: tier, partner_until: until, partner_subscription_id: sub.id }).eq("id", data.storeId);
    return { tier, until };
  });
