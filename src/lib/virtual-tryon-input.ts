export interface VirtualTryOnGarment {
  dataUrl: string;
  name: string;
  category: string;
  material?: string;
}

export function validateVirtualTryOnInput(data: { bodyDataUrl: string; garments: VirtualTryOnGarment[] }) {
  if (!data?.bodyDataUrl?.startsWith("data:image/")) throw new Error("Foto do corpo inválida.");
  if (!Array.isArray(data.garments) || data.garments.length === 0) {
    throw new Error("Escolha pelo menos uma peça.");
  }
  if (data.garments.some((garment) => !garment?.dataUrl?.startsWith("data:image/"))) {
    throw new Error("Uma das peças possui imagem inválida.");
  }
  return data;
}