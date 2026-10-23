import { describe, expect, test } from "bun:test";
import { validateVirtualTryOnInput } from "./virtual-tryon-input";

describe("seleção de peças do provador", () => {
  test("envia todas as peças escolhidas, inclusive mais de cinco", () => {
    const garments = Array.from({ length: 12 }, (_, i) => ({
      name: `Peça ${i}`, category: "Acessório", dataUrl: "data:image/jpeg;base64,YQ==",
    }));
    const result = validateVirtualTryOnInput({ bodyDataUrl: "data:image/jpeg;base64,Yg==", garments });
    expect(result.garments).toHaveLength(12);
    expect(result.garments).toEqual(garments);
  });
  test("não envia uma seleção vazia", () => {
    expect(() => validateVirtualTryOnInput({ bodyDataUrl: "data:image/jpeg;base64,Yg==", garments: [] })).toThrow();
  });
});