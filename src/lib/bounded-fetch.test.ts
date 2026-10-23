import { test } from "node:test";
import assert from "node:assert/strict";
import { boundedFetch } from "./bounded-fetch.server";

test("respostas acima do limite são canceladas mesmo sem content-length", async () => {
  const original = globalThis.fetch;
  let canceled = false;
  globalThis.fetch = async () => new Response(new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(8)); },
    cancel() { canceled = true; },
  }));
  try {
    await assert.rejects(boundedFetch("https://example.invalid", {}, { maxBytes: 4 }), /grande/);
    assert.equal(canceled, true);
  } finally { globalThis.fetch = original; }
});
test("tempo máximo interrompe serviço lento", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
  });
  try { await assert.rejects(boundedFetch("https://example.invalid", {}, { timeoutMs: 10 }), /demorou/); }
  finally { globalThis.fetch = original; }
});