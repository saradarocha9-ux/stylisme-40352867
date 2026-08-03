// Remoção de fundo via API do remove.bg (rápida, feita no servidor).
import { removeBgRemote } from "./removebg.functions";

const MAX_DIM = 1600;

export async function removeImageBackground(file: File | Blob): Promise<string> {
  const dataUrl = await downscale(await blobToDataUrl(file));
  const { dataUrl: out, mode } = await removeBgRemote({ data: { dataUrl } });
  const cut = mode === "whitebg" ? await whiteToTransparent(out) : out;
  return trimTransparentMargins(cut);
}

/** Converte o fundo branco puro (recorte por IA) em transparência real. */
async function whiteToTransparent(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  try {
    const image = await loadImage(dataUrl);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return dataUrl;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const px = imageData.data;

    // Flood fill a partir das bordas: só apaga o branco conectado ao fundo,
    // preservando áreas brancas dentro da própria peça.
    const visited = new Uint8Array(width * height);
    const stack: number[] = [];
    const isWhite = (i: number) => px[i * 4] > 235 && px[i * 4 + 1] > 235 && px[i * 4 + 2] > 235;
    for (let x = 0; x < width; x += 1) {
      stack.push(x, (height - 1) * width + x);
    }
    for (let y = 0; y < height; y += 1) {
      stack.push(y * width, y * width + width - 1);
    }
    while (stack.length) {
      const i = stack.pop() as number;
      if (i < 0 || i >= width * height || visited[i]) continue;
      visited[i] = 1;
      if (!isWhite(i)) continue;
      px[i * 4 + 3] = 0;
      const x = i % width;
      const y = (i - x) / width;
      if (x > 0) stack.push(i - 1);
      if (x < width - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - width);
      if (y < height - 1) stack.push(i + width);
    }

    // Suaviza a borda: pixels claros vizinhos de transparência ficam semitransparentes.
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = y * width + x;
        if (px[i * 4 + 3] === 0) continue;
        const near =
          px[(i - 1) * 4 + 3] === 0 ||
          px[(i + 1) * 4 + 3] === 0 ||
          px[(i - width) * 4 + 3] === 0 ||
          px[(i + width) * 4 + 3] === 0;
        if (near && px[i * 4] > 225 && px[i * 4 + 1] > 225 && px[i * 4 + 2] > 225) {
          px[i * 4 + 3] = 90;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
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
