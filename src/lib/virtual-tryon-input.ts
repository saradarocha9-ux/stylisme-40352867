import { validateImageDataUrl, MAX_BATCH_CHARS } from "./image-input";

export interface VirtualTryOnGarment {
  dataUrl: string;
  name: string;
  category: string;
  material?: string;
}

export function validateVirtualTryOnInput(data: { bodyDataUrl: string; garments: VirtualTryOnGarment[] }) {
  validateImageDataUrl(data?.bodyDataUrl);
  if (!Array.isArray(data.garments) || data.garments.length === 0) {
    throw new Error("Escolha pelo menos uma peça.");
  }
  let size = data.bodyDataUrl.length;
  for (const garment of data.garments) {
    validateImageDataUrl(garment?.dataUrl);
    if (typeof garment.name !== "string" || typeof garment.category !== "string" || garment.name.length > 240 || garment.category.length > 100 || (garment.material != null && (typeof garment.material !== "string" || garment.material.length > 240))) {
      throw new Error("Revise os dados das peças selecionadas.");
    }
    size += garment.dataUrl.length;
    if (size > MAX_BATCH_CHARS) throw new Error("As fotos selecionadas são muito grandes. Use imagens menores; suas peças continuam selecionadas.");
  }
  return data;
}