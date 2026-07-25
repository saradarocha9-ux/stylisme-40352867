// Remoção de fundo via API do remove.bg (rápida, feita no servidor).
import { removeBgRemote } from "./removebg.functions";

const MAX_DIM = 1600;

export async function removeImageBackground(file: File | Blob): Promise<string> {
  const dataUrl = await downscale(await blobToDataUrl(file));
  const { dataUrl: out } = await removeBgRemote({ data: { dataUrl } });
  return out;
}

/** Reduz a imagem antes de enviar, para acelerar o upload. */
async function downscale(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    if (scale === 1) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
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
