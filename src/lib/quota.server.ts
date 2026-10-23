import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type UsageKind = "ai" | "tryon" | "planner" | "publish" | "wardrobe";

// Wardrobe registration (photo cleanup + auto-detect) is core, so it gets its own larger Free allowance.
const FREE_LIMITS: Record<UsageKind, number> = { ai: 3, tryon: 3, planner: 3, publish: 3, wardrobe: 30 };

export async function runWithDailyQuota<T>(input: {
  supabase: SupabaseClient<Database>;
  userId: string;
  kind: UsageKind;
  action: () => Promise<T>;
}): Promise<T> {
  const lease = await input.supabase.rpc("acquire_ai_request");
  if (lease.error) throw new Error("Não foi possível iniciar sua solicitação agora.");
  if (!lease.data) throw new Error("Aguarde sua solicitação atual terminar antes de enviar outra.");
  let consumed = false;
  try {
  const { data, error } = await input.supabase.rpc("consume_daily_usage", {
    _kind: input.kind,
    _free_limit: FREE_LIMITS[input.kind],
  });
  if (error) throw new Error("Não foi possível conferir seu limite agora.");
  const usage = data?.[0];
  if (!usage?.allowed) {
    throw new Error(
      input.kind === "wardrobe"
        ? "Você cadastrou o máximo de peças com IA hoje no plano Free. Volte amanhã ou assine o Premium."
        : input.kind === "tryon" ? `Você usou as ${FREE_LIMITS.tryon} provas no corpo de hoje no plano Free.`
        : `Você usou as ${FREE_LIMITS[input.kind]} ações de hoje no plano Free.`,
    );
  }

    consumed = true;
    return await input.action();
  } catch (error) {
    if (consumed) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("refund_daily_usage", { _user_id: input.userId, _kind: input.kind });
    }
    throw error;
  } finally {
    await input.supabase.rpc("release_ai_request", { _token: lease.data });
  }
}
