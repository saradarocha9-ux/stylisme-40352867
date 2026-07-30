/**
 * Redimensiona uma imagem (data URL) mantendo a proporção.
 * As peças precisam entrar no provador como referências pequenas: quando a
 * imagem da roupa chega maior que a foto do corpo, o modelo tende a devolver
 * a peça gigante ao fundo e a pessoa reduzida.
 */
export async function resizeDataUrl(dataUrl: string, maxSide: number): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale >= 1) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
}

export async function imageAspect(dataUrl: string): Promise<number | null> {
  if (typeof document === "undefined") return null;
  try {
    const img = await loadImage(dataUrl);
    if (!img.naturalHeight) return null;
    return img.naturalWidth / img.naturalHeight;
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = src;
  });
}
