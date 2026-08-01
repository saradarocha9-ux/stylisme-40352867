/**
 * Gera cards de compartilhamento (formato stories 1080x1920) em canvas,
 * prontos para Instagram / TikTok / WhatsApp.
 */
import type { ColorAnalysis } from "./color-ai.functions";
import logoAsset from "@/assets/stylisme-logo-v3.png.asset.json";

const W = 1080;
const H = 1920;




function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function base(ctx: CanvasRenderingContext2D, colors: [string, string, string], dark: boolean) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, colors[0]);
  g.addColorStop(0.55, colors[1]);
  g.addColorStop(1, colors[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // brilho suave
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.28, 40, W * 0.5, H * 0.28, W * 0.9);
  glow.addColorStop(0, dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

async function footer(ctx: CanvasRenderingContext2D, _ink?: string) {
  const logo = await loadImage(logoAsset.url).catch(() => null);
  if (!logo) return;
  const size = 190;
  const ratio = logo.height / logo.width;
  ctx.drawImage(logo, (W - size) / 2, H - 120 - size * ratio, size, size * ratio);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/png", 0.95));
}

/** Card da análise de coloração pessoal: foto em cima, círculos de cor embaixo. */
export async function renderPaletteCard(a: ColorAnalysis, photoUrl?: string | null): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  base(ctx, ["#F7F2EA", "#EFE6DA", "#E4D8C8"], false);
  const ink = "#171412";

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.font = "500 92px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("Minha paleta de cores", W / 2, 210);

  // foto da pessoa
  const photo = photoUrl ? await loadImage(photoUrl).catch(() => null) : null;
  const fx = 150;
  const fy = 300;
  const fw = W - fx * 2;
  const fh = 780;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.14)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, fx, fy, fw, fh, 56);
  ctx.fill();
  ctx.restore();
  if (photo) {
    ctx.save();
    roundRect(ctx, fx, fy, fw, fh, 56);
    ctx.clip();
    const s = Math.max(fw / photo.width, fh / photo.height);
    const w = photo.width * s;
    const h = photo.height * s;
    ctx.drawImage(photo, fx + (fw - w) / 2, fy + (fh - h) / 2, w, h);
    ctx.restore();
  }

  // estação
  ctx.fillStyle = ink;
  ctx.font = "500 72px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(a.season, W / 2, fy + fh + 110);

  // círculos de cor
  const colors = a.palette.slice(0, 12);
  const cols = 6;
  const r = 62;
  const gap = 32;
  const rows = Math.ceil(colors.length / cols);
  const gridW = cols * r * 2 + (cols - 1) * gap;
  const startX = (W - gridW) / 2 + r;
  const startY = fy + fh + 220;
  colors.forEach((c, i) => {
    const cx = startX + (i % cols) * (r * 2 + gap);
    const cy = startY + Math.floor(i / cols) * (r * 2 + gap);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.16)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = c.hex;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  const afterGrid = startY + rows * (r * 2) + (rows - 1) * gap;

  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.65;
  ctx.font = "400 32px Inter, sans-serif";
  ctx.fillText("Inteligência para o seu armário", W / 2, Math.max(afterGrid + 70, H - 360));
  ctx.globalAlpha = 1;

  await footer(ctx, ink);
  return toBlob(canvas);
}

/** Card de um look / provador com as peças. */
export async function renderLookCard(opts: {
  title: string;
  subtitle?: string;
  images: string[];
  accent?: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  base(ctx, ["#F7F2EA", "#EDE3D6", "#DFD2C2"], false);
  const ink = "#171412";

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.6;
  ctx.font = "500 30px Inter, sans-serif";
  ctx.fillText("MEU LOOK", W / 2, 200);
  ctx.globalAlpha = 1;
  ctx.font = "500 96px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(opts.title.slice(0, 22), W / 2, 320);
  if (opts.subtitle) {
    ctx.globalAlpha = 0.7;
    ctx.font = "400 34px Inter, sans-serif";
    ctx.fillText(opts.subtitle.slice(0, 46), W / 2, 380);
    ctx.globalAlpha = 1;
  }

  const imgs = await Promise.all(
    opts.images.slice(0, 4).map((s) => loadImage(s).catch(() => null))
  );
  const valid = imgs.filter(Boolean) as HTMLImageElement[];
  const cols = valid.length <= 2 ? 1 : 2;
  const cell = cols === 1 ? 620 : 430;
  const gap = 40;
  const gridW = cols * cell + (cols - 1) * gap;
  const startX = (W - gridW) / 2;
  const startY = 470;
  valid.forEach((img, i) => {
    const x = startX + (i % cols) * (cell + gap);
    const y = startY + Math.floor(i / cols) * (cell + gap);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#FFFFFF";
    roundRect(ctx, x, y, cell, cell, 44);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, cell, cell, 44);
    ctx.clip();
    const r = Math.min(cell / img.width, cell / img.height) * 0.86;
    const w = img.width * r;
    const h = img.height * r;
    ctx.drawImage(img, x + (cell - w) / 2, y + (cell - h) / 2, w, h);
    ctx.restore();
  });

  await footer(ctx, ink);
  return toBlob(canvas);
}

/** Compartilha (Web Share) ou baixa o card. */
export async function shareBlob(blob: Blob, filename: string, text: string) {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text, title: "Stylisme" });
    return "shared" as const;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded" as const;
}

/** Card do provador: recria a composição corpo + peças. */
export async function renderTryOnCard(opts: {
  bodyUrl: string;
  pieces: { url: string; x: number; y: number; scale: number; rotation: number; z: number }[];
  caption?: string;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  base(ctx, ["#F7F2EA", "#EFE6DA", "#E2D6C6"], false);
  const ink = "#171412";

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.6;
  ctx.font = "500 30px Inter, sans-serif";
  ctx.fillText("MEU LOOK", W / 2, 170);
  ctx.globalAlpha = 1;
  ctx.font = "500 92px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(opts.caption?.slice(0, 24) || "Meu look", W / 2, 275);

  // moldura da composição
  const fx = 90;
  const fy = 340;
  const fw = W - fx * 2;
  const fh = 1250;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.14)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, fx, fy, fw, fh, 56);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, fx, fy, fw, fh, 56);
  ctx.clip();

  const bodyImg = await loadImage(opts.bodyUrl).catch(() => null);
  let rect = { left: fx, top: fy, width: fw, height: fh };
  if (bodyImg) {
    const s = Math.min(fw / bodyImg.width, fh / bodyImg.height);
    const w = bodyImg.width * s;
    const h = bodyImg.height * s;
    rect = { left: fx + (fw - w) / 2, top: fy + (fh - h) / 2, width: w, height: h };
    ctx.drawImage(bodyImg, rect.left, rect.top, w, h);
  }

  const ordered = [...opts.pieces].sort((a, b) => a.z - b.z);
  for (const p of ordered) {
    const img = await loadImage(p.url).catch(() => null);
    if (!img) continue;
    const width = rect.width * 0.4 * p.scale;
    const height = (img.height / img.width) * width;
    const cx = rect.left + rect.width * p.x;
    const cy = rect.top + rect.height * p.y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.16)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
  ctx.restore();

  await footer(ctx, ink);
  return toBlob(canvas);
}
