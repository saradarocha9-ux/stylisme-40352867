/**
 * Gera cards de compartilhamento (formato stories 1080x1920) em canvas,
 * prontos para Instagram / TikTok / WhatsApp.
 */
import type { ColorAnalysis } from "./color-ai.functions";

const W = 1080;
const H = 1920;

const FAMILY_COLORS: Record<string, [string, string, string]> = {
  Primavera: ["#FFE6C2", "#FF9A8B", "#7ED9A7"],
  Verão: ["#E8EEFB", "#CBD7F5", "#E7C6DE"],
  Outono: ["#F4E2CC", "#E0A05A", "#7C8C4B"],
  Inverno: ["#151B2E", "#3B2450", "#2E8B8B"],
};

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

function footer(ctx: CanvasRenderingContext2D, ink: string) {
  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.75;
  ctx.font = "500 30px Inter, sans-serif";
  ctx.fillText("STYLISME · INTELIGÊNCIA PARA O SEU ARMÁRIO", W / 2, H - 118);
  ctx.globalAlpha = 0.55;
  ctx.font = "400 26px Inter, sans-serif";
  ctx.fillText("stylisme.lovable.app", W / 2, H - 68);
  ctx.globalAlpha = 1;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/png", 0.95));
}

/** Card da análise de coloração pessoal. */
export async function renderPaletteCard(a: ColorAnalysis): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const dark = a.seasonFamily === "Inverno";
  base(ctx, FAMILY_COLORS[a.seasonFamily] ?? FAMILY_COLORS.Primavera, dark);
  const ink = dark ? "#FFFFFF" : "#171412";

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.6;
  ctx.font = "500 30px Inter, sans-serif";
  ctx.fillText("MINHA COLORAÇÃO PESSOAL", W / 2, 220);
  ctx.globalAlpha = 1;

  ctx.font = "500 104px 'Cormorant Garamond', Georgia, serif";
  const words = a.season.split(" ");
  const line1 = words.slice(0, 1).join(" ");
  const line2 = words.slice(1).join(" ");
  ctx.fillText(line1, W / 2, 350);
  if (line2) ctx.fillText(line2, W / 2, 460);

  ctx.globalAlpha = 0.75;
  ctx.font = "400 34px Inter, sans-serif";
  ctx.fillText(a.subtitle.slice(0, 46), W / 2, line2 ? 530 : 420);
  ctx.globalAlpha = 1;

  // grade de cores 4x3
  const cols = 4;
  const size = 200;
  const gap = 24;
  const gridW = cols * size + (cols - 1) * gap;
  const startX = (W - gridW) / 2;
  const startY = 620;
  a.palette.slice(0, 12).forEach((c, i) => {
    const x = startX + (i % cols) * (size + gap);
    const y = startY + Math.floor(i / cols) * (size + gap);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = c.hex;
    roundRect(ctx, x, y, size, size, 36);
    ctx.fill();
    ctx.restore();
  });

  // atributos
  const attrs: [string, string][] = [
    ["Subtom", a.undertone],
    ["Contraste", a.contrast],
    ["Intensidade", a.chroma],
  ];
  const boxY = startY + 3 * size + 2 * gap + 70;
  const boxW = 300;
  attrs.forEach(([label, value], i) => {
    const x = (W - (boxW * 3 + gap * 2)) / 2 + i * (boxW + gap);
    ctx.fillStyle = dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)";
    roundRect(ctx, x, boxY, boxW, 150, 32);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.6;
    ctx.font = "500 24px Inter, sans-serif";
    ctx.fillText(label.toUpperCase(), x + boxW / 2, boxY + 58);
    ctx.globalAlpha = 1;
    ctx.font = "500 44px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText(value, x + boxW / 2, boxY + 112);
  });

  footer(ctx, ink);
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
  ctx.fillText("MEU LOOK DE HOJE", W / 2, 200);
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

  footer(ctx, ink);
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
