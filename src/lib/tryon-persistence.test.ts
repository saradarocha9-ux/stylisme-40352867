import { test } from "node:test";
import assert from "node:assert/strict";

test("foto vestida persiste na conta até remover a peça ou limpar", async () => {
  const values = new Map<string, string>();
  Object.assign(globalThis, {
    window: { addEventListener() {} },
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  const { actions, setStoreUser } = await import("./store");
  setStoreUser("test-owner");
  actions.updateProfile({ bodyPhotoUrl: "body" });
  const garment = actions.addGarment({ name: "Camisa", category: "Camisa", color: "azul", occasions: [], seasons: [] });
  actions.tryOnAdd(garment.id);
  actions.tryOnSaveResult("dressed", "body", [garment.id], "test-owner");
  setStoreUser("other-account");
  assert.equal(JSON.parse(values.get("stylisme:v1:test-owner") ?? "{}").tryOnResult, "dressed");
  setStoreUser("test-owner");
  actions.tryOnRemove(garment.id);
  setStoreUser("other-account");
  assert.equal(JSON.parse(values.get("stylisme:v1:test-owner") ?? "{}").tryOnResult, undefined);
  setStoreUser("test-owner");
  actions.tryOnAdd(garment.id);
  actions.tryOnSaveResult("dressed", "body", [garment.id], "test-owner");
  actions.tryOnClear();
  actions.tryOnSaveResult("stale", "body", [garment.id], "test-owner");
  setStoreUser("other-account");
  const cleared = JSON.parse(values.get("stylisme:v1:test-owner") ?? "{}");
  assert.equal(cleared.tryOnResult, undefined);
  assert.equal(cleared.tryOn.length, 0);
});