import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateVirtualTryOnInput } from "./virtual-tryon-input";

describe("seleção de peças do provador", () => {
  test("envia todas as peças escolhidas, inclusive mais de cinco", () => {
    const garments = Array.from({ length: 12 }, (_, i) => ({
      name: `Peça ${i}`, category: "Acessório", dataUrl: "data:image/jpeg;base64,YQ==",
    }));
    const result = validateVirtualTryOnInput({ bodyDataUrl: "data:image/jpeg;base64,Yg==", garments });
    assert.equal(result.garments.length, 12);
    assert.deepEqual(result.garments, garments);
  });
  test("não envia uma seleção vazia", () => {
    assert.throws(() => validateVirtualTryOnInput({ bodyDataUrl: "data:image/jpeg;base64,Yg==", garments: [] }));
  });
  test("rejeita foto acima de 8 MiB de caracteres", () => {
    assert.throws(() => validateVirtualTryOnInput({ bodyDataUrl: "data:image/jpeg;base64," + "A".repeat(8 * 1024 * 1024), garments: [{ name: "Camisa", category: "Camisa", dataUrl: "data:image/jpeg;base64,YQ==" }] }), /grande/);
  });
  test("rejeita lote acima de 16 MiB sem truncar a seleção", () => {
    const garments = Array.from({ length: 6 }, () => ({ name: "Peça", category: "Acessório", dataUrl: "data:image/jpeg;base64," + "A".repeat(3 * 1024 * 1024) }));
    assert.throws(() => validateVirtualTryOnInput({ bodyDataUrl: "data:image/jpeg;base64,Yg==", garments }), /grandes/);
    assert.equal(garments.length, 6);
  });
});