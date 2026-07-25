import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Stylisme Premium price (BRL 24,90/mo)
export const PREMIUM_PRICE_ID = "price_1TvnaiKGRX9cr4A84ODJyQmY";
export const PREMIUM_PRODUCT_ID = "prod_Uveu4Dq35crLeE";

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { apiVersion: "2025-08-27.basil" as never });
}

function getEmail(claims: Record<string, unknown>): string {
  const email = claims.email;
  if (typeof email !== "string" || !email) {
    throw new Error("Conta sem email — impossível criar assinatura.");
  }
  return email;
}

function getOrigin(): string {
  const forwardedProto = getRequestHeader("x-forwarded-proto") ?? "https";
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  if (host) return `${forwardedProto}://${host}`;
  return "https://stylisme.lovable.app";
}

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = getEmail(context.claims);
    const stripe = await getStripe();

    const existing = await stripe.customers.list({ email, limit: 1 });
    const customerId = existing.data[0]?.id;

    const origin = getOrigin();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      success_url: `${origin}/app/subscription?checkout=success`,
      cancel_url: `${origin}/app/premium?checkout=cancelled`,
    });

    return { url: session.url };
  });

export interface SubscriptionStatus {
  subscribed: boolean;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
  productId: string | null;
}

export const checkSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionStatus> => {
    const email = getEmail(context.claims);
    const stripe = await getStripe();

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      await syncProfilePlan(context.supabase, context.userId, false);
      return { subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false, productId: null };
    }
    const customerId = customers.data[0].id;

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subs.data.length === 0) {
      await syncProfilePlan(context.supabase, context.userId, false);
      return { subscribed: false, subscriptionEnd: null, cancelAtPeriodEnd: false, productId: null };
    }

    const sub = subs.data[0];
    const item = sub.items.data[0];
    const periodEnd = (item as unknown as { current_period_end?: number }).current_period_end
      ?? (sub as unknown as { current_period_end?: number }).current_period_end
      ?? null;

    await syncProfilePlan(context.supabase, context.userId, true);

    return {
      subscribed: true,
      subscriptionEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      productId: typeof item.price.product === "string" ? item.price.product : item.price.product.id,
    };
  });

export const openCustomerPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = getEmail(context.claims);
    const stripe = await getStripe();

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("Nenhuma assinatura encontrada para esta conta.");
    }

    const origin = getOrigin();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/app/subscription`,
    });
    return { url: portal.url };
  });

async function syncProfilePlan(
  supabase: SupabaseClient<Database>,
  userId: string,
  subscribed: boolean,
) {
  try {
    await supabase.from("profiles").update({ plan: subscribed ? "premium" : "free" }).eq("id", userId);
  } catch (e) {
    console.error("[stripe] failed to sync profile plan", e);
  }
}
