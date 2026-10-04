import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type UsageKind = "ai" | "tryon" | "planner" | "publish";

export async function runWithDailyQuota<T>(input: {
  supabase: SupabaseClient<Database>;
  userId: string;
  kind: UsageKind;
  action: () => Promise<T>;
}): Promise<T> {
  const { data, error } = await input.supabase.rpc("consume_daily_usage", {
    _kind: input.kind,
  });
  if (error) throw new Error("Não foi possível conferir seu limite agora.");
  const usage = data?.[0];
  if (!usage?.allowed) throw new Error("Você usou as 3 ações de hoje no plano Free.");

  try {
    return await input.action();
  } catch (error) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("refund_daily_usage", { _user_id: input.userId, _kind: input.kind });
    throw error;
  }
}
