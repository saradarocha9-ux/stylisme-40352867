// Remoção de fundo 100% no navegador (WASM) via @imgly/background-removal.
// Primeira chamada baixa o modelo (~40MB) — depois fica em cache.
import { removeBackground } from "@imgly/background-removal";

export async function removeImageBackground(file: File | Blob): Promise<string> {
  const blob = await removeBackground(file, {
    output: { format: "image/png", quality: 0.9 },
  });
  return await blobToDataUrl(blob);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return blobToDataUrl(file);
}
