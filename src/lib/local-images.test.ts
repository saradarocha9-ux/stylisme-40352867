import { test } from "node:test";
import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { packImages, resolveImages, deleteLocalImages } from "./local-images";

Object.assign(globalThis, { indexedDB });
class TestFileReader {
  result: string | null = null;
  error = null;
  onload?: () => void;
  onerror?: () => void;
  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString("base64")}`;
      this.onload?.();
    });
  }
}
Object.assign(globalThis, { FileReader: TestFileReader });

test("fotos ficam fora do JSON e só a conta dona recupera", async () => {
  const photo = "data:image/png;base64,YQ==";
  const state = { garments: [{ imageUrl: photo }], tryOnResult: photo };
  const packed = await packImages("owner-a", state);
  assert.equal(JSON.stringify(packed).includes("data:image/"), false);
  assert.equal(packed.garments[0]?.imageUrl, packed.tryOnResult);
  const result = await resolveImages("owner-a", packed);
  assert.deepEqual(result.state, state);
  await assert.rejects(resolveImages("owner-b", packed), /outra conta/);
  await deleteLocalImages("owner-b");
  assert.deepEqual((await resolveImages("owner-a", packed)).state, state);
  await deleteLocalImages("owner-a");
  await assert.rejects(resolveImages("owner-a", packed), /recuperar/);
});