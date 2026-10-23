import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { runWithDailyQuota } from "./quota.server";

test("solicitação concorrente não consome prova nem chama serviço", async () => {
  const calls: string[] = [];
  const client = { rpc: async (name: string) => { calls.push(name); return { data: null, error: null }; } } as unknown as SupabaseClient<Database>;
  let actions = 0;
  await assert.rejects(runWithDailyQuota({ supabase: client, userId: "a", kind: "tryon", action: async () => ++actions }), /Aguarde/);
  assert.deepEqual(calls, ["acquire_ai_request"]);
  assert.equal(actions, 0);
});
test("Free mantém três provas e libera a solicitação após sucesso", async () => {
  const calls: string[] = [];
  let limit = 0;
  const client = { rpc: async (name: string, args?: { _free_limit?: number }) => {
    calls.push(name);
    if (name === "consume_daily_usage") limit = args?._free_limit ?? 0;
    return { data: name === "acquire_ai_request" ? "token" : [{ allowed: true }], error: null };
  } } as unknown as SupabaseClient<Database>;
  assert.equal(await runWithDailyQuota({ supabase: client, userId: "a", kind: "tryon", action: async () => "photo" }), "photo");
  assert.equal(limit, 3);
  assert.deepEqual(calls, ["acquire_ai_request", "consume_daily_usage", "release_ai_request"]);
});