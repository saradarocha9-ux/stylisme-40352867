// Remoção de fundo via API do remove.bg (rápida, feita no servidor).
import { removeBgRemote } from "./removebg.functions";

const MAX_DIM = 1600;

export async function removeImageBackground(file: File | Blob): Promise<string> {
  const dataUrl = await downscale(await blobToDataUrl(file));
  const { dataUrl: out } = await removeBgRemote({ data: { dataUrl } });
  return trimTransparentMargins(out);
}

/** Remove o espaço transparente deixado ao redor do corpo ou da peça. */
async function trimTransparentMargins(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  try {
    const image = await loadImage(dataUrl);
    const source = document.createElement("canvas");
    source.width = image.naturalWidth || image.width;
    source.height = image.naturalHeight || image.height;
    const context = source.getContext("2d", { willReadFrequently: true });
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        if (pixels[(y * source.width + x) * 4 + 3] > 8) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX < minX || maxY < minY) return dataUrl;
    const padding = Math.round(Math.max(source.width, source.height) * 0.01);
    const left = Math.max(0, minX - padding);
    const top = Math.max(0, minY - padding);
    const right = Math.min(source.width, maxX + padding + 1);
    const bottom = Math.min(source.height, maxY + padding + 1);
    const output = document.createElement("canvas");
    output.width = right - left;
    output.height = bottom - top;
    const outputContext = output.getContext("2d");
    if (!outputContext) return dataUrl;
    outputContext.drawImage(source, left, top, output.width, output.height, 0, 0, output.width, output.height);
    return output.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
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
