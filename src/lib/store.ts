// Lightweight client-side persistence for the first iteration.
// Backend (Firebase/Stripe/AI) plugs in later behind these same helpers.
import { useEffect, useState, useCallback } from "react";

export type Category =
  | "Camiseta" | "Camisa" | "Blusa" | "Vestido" | "Saia"
  | "Calça" | "Shorts" | "Casaco" | "Sapato" | "Acessório";

export type Occasion =
  | "Trabalho" | "Faculdade" | "Casual" | "Festa" | "Casamento"
  | "Viagem" | "Evento" | "Academia" | "Praia" | "Jantar";

export type Style =
  | "Elegante" | "Minimalista" | "Streetwear" | "Casual"
  | "Fashionista" | "Vintage" | "Romântico" | "Esportivo";

export type Season = "Verão" | "Outono" | "Inverno" | "Primavera";

export interface Garment {
  id: string;
  name: string;
  category: Category;
  color: string;
  pattern?: string;
  material?: string;
  occasions: Occasion[];
  seasons: Season[];
  imageUrl?: string;
  favorite: boolean;
  createdAt: number;
  wearCount: number;
}

export interface Look {
  id: string;
  name: string;
  garmentIds: string[];
  occasion?: Occasion;
  style?: Style;
  favorite: boolean;
  createdAt: number;
}

export interface Plan {
  id: string;
  date: string; // yyyy-mm-dd
  time?: string;
  note?: string;
  lookId?: string;
}

export interface Profile {
  name: string;
  email: string;
  photoUrl?: string;
  bodyPhotoUrl?: string;
  plan: "free" | "premium";
  joinedAt: number;
  language: "pt-BR" | "en-US";
  notifications: boolean;
  theme: "light" | "dark" | "system";
  facePhotoUrl?: string;
  colorAnalysis?: import("./color-ai.functions").ColorAnalysis;
  colorAnalyzedAt?: number;
}

export interface TryOnItem {
  garmentId: string;
  x: number; // 0..1 (relative to canvas)
  y: number; // 0..1
  scale: number; // 1 = 40% of canvas width
  rotation: number; // deg
  z: number;
  autoX?: number;
  autoY?: number;
  autoScale?: number;
  height?: number; // fração da altura da foto do corpo
  autoHeight?: number;
  autoRotation?: number;
}

export interface Gamify {
  xp: number;
  streak: number;
  best: number;
  lastActive: string; // yyyy-mm-dd
  unlocked: string[];
}

interface AppState {
  garments: Garment[];
  looks: Look[];
  plans: Plan[];
  profile: Profile;
  tryOn: TryOnItem[];
  gamify: Gamify;
}

const KEY = "stylisme:v1";

const defaultProfile: Profile = {
  name: "Você",
  email: "",
  plan: "free",
  joinedAt: Date.now(),
  language: "pt-BR",
  notifications: true,
  theme: "system",
};

const defaultGamify: Gamify = { xp: 0, streak: 0, best: 0, lastActive: "", unlocked: [] };

const initial: AppState = {
  garments: [],
  looks: [],
  plans: [],
  profile: defaultProfile,
  tryOn: [],
  gamify: defaultGamify,
};


function read(): AppState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      garments: parsed.garments ?? [],
      looks: parsed.looks ?? [],
      plans: parsed.plans ?? [],
      profile: { ...defaultProfile, ...(parsed.profile ?? {}) },
      tryOn: parsed.tryOn ?? [],
      gamify: { ...defaultGamify, ...(parsed.gamify ?? {}) },
    };
  } catch {
    return initial;
  }
}


function write(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("stylisme:update"));
}

export function useStore() {
  const [state, setState] = useState<AppState>(initial);

  useEffect(() => {
    setState(read());
    const onUpdate = () => setState(read());
    window.addEventListener("stylisme:update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("stylisme:update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const update = useCallback((mutator: (s: AppState) => AppState) => {
    const next = mutator(read());
    write(next);
    setState(next);
  }, []);

  return { state, update };
}

/* ---------------- Gamificação ---------------- */

export const XP_TABLE = {
  garment: 15,
  look: 25,
  tryon: 20,
  palette: 60,
  ai: 10,
  share: 40,
} as const;

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  test: (s: AppState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-piece", title: "Primeira peça", desc: "Cadastre 1 roupa", emoji: "👕", test: (s) => s.garments.length >= 1 },
  { id: "closet-10", title: "Armário montado", desc: "10 peças cadastradas", emoji: "🧺", test: (s) => s.garments.length >= 10 },
  { id: "closet-30", title: "Guarda-roupa dos sonhos", desc: "30 peças cadastradas", emoji: "🏛️", test: (s) => s.garments.length >= 30 },
  { id: "first-look", title: "Estilista iniciante", desc: "Crie o primeiro look", emoji: "✨", test: (s) => s.looks.length >= 1 },
  { id: "looks-10", title: "Coleção autoral", desc: "10 looks criados", emoji: "🎨", test: (s) => s.looks.length >= 10 },
  { id: "palette", title: "Cores reveladas", desc: "Descubra sua cartela", emoji: "🌈", test: (s) => !!s.profile.colorAnalysis },
  { id: "mirror", title: "Provador aberto", desc: "Experimente uma peça", emoji: "🪞", test: (s) => s.tryOn.length >= 1 },
  { id: "streak-3", title: "Ritmo de estilo", desc: "3 dias seguidos", emoji: "🔥", test: (s) => s.gamify.streak >= 3 },
  { id: "streak-7", title: "Semana impecável", desc: "7 dias seguidos", emoji: "⚡", test: (s) => s.gamify.streak >= 7 },
  { id: "streak-30", title: "Ícone de moda", desc: "30 dias seguidos", emoji: "👑", test: (s) => s.gamify.streak >= 30 },
];

export const LEVELS = [
  { min: 0, name: "Iniciante" },
  { min: 150, name: "Antenada" },
  { min: 400, name: "Estilosa" },
  { min: 800, name: "Stylist" },
  { min: 1500, name: "Ícone" },
  { min: 3000, name: "Lenda" },
];

export function levelOf(xp: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (xp >= l.min) idx = i; });
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { level: idx + 1, name: current.name, next, progress: Math.min(1, Math.max(0, progress)) };
}

export const actions = {

  addGarment(g: Omit<Garment, "id" | "createdAt" | "favorite" | "wearCount">) {
    const s = read();
    const garment: Garment = {
      ...g,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      favorite: false,
      wearCount: 0,
    };
    write({ ...s, garments: [garment, ...s.garments] });
    return garment;
  },
  removeGarment(id: string) {
    const s = read();
    write({
      ...s,
      garments: s.garments.filter((g) => g.id !== id),
      looks: s.looks.map((l) => ({ ...l, garmentIds: l.garmentIds.filter((g) => g !== id) })),
    });
  },
  toggleGarmentFav(id: string) {
    const s = read();
    write({ ...s, garments: s.garments.map((g) => g.id === id ? { ...g, favorite: !g.favorite } : g) });
  },
  addLook(l: Omit<Look, "id" | "createdAt" | "favorite">) {
    const s = read();
    const look: Look = { ...l, id: crypto.randomUUID(), createdAt: Date.now(), favorite: false };
    write({
      ...s,
      looks: [look, ...s.looks],
      garments: s.garments.map((g) => l.garmentIds.includes(g.id) ? { ...g, wearCount: g.wearCount + 1 } : g),
    });
    return look;
  },
  toggleLookFav(id: string) {
    const s = read();
    write({ ...s, looks: s.looks.map((l) => l.id === id ? { ...l, favorite: !l.favorite } : l) });
  },
  removeLook(id: string) {
    const s = read();
    write({ ...s, looks: s.looks.filter((l) => l.id !== id), plans: s.plans.map((p) => p.lookId === id ? { ...p, lookId: undefined } : p) });
  },
  addPlan(p: Omit<Plan, "id">) {
    const s = read();
    const plan: Plan = { ...p, id: crypto.randomUUID() };
    write({ ...s, plans: [...s.plans, plan] });
    return plan;
  },
  removePlan(id: string) {
    const s = read();
    write({ ...s, plans: s.plans.filter((p) => p.id !== id) });
  },
  updateProfile(patch: Partial<Profile>) {
    const s = read();
    write({ ...s, profile: { ...s.profile, ...patch } });
  },
  tryOnAdd(garmentId: string, detectedFit?: { x: number; y: number; width: number; height: number; rotation?: number }) {
    const s = read();
    if (s.tryOn.find((t) => t.garmentId === garmentId)) return;
    const g = s.garments.find((x) => x.id === garmentId);
    const fallback = fitFor(g?.category);
    const fit = detectedFit
      ? {
          ...fallback,
          x: detectedFit.x,
          y: detectedFit.y,
          scale: detectedFit.width / 0.4,
          height: detectedFit.height,
          rotation: detectedFit.rotation ?? 0,
          autoX: detectedFit.x,
          autoY: detectedFit.y,
          autoScale: detectedFit.width / 0.4,
          autoHeight: detectedFit.height,
          autoRotation: detectedFit.rotation ?? 0,
        }
      : fallback;
    // Substitui peças que ocupam o mesmo lugar no corpo (ex.: duas calças).
    const tryOn = s.tryOn.filter((t) => {
      const other = s.garments.find((x) => x.id === t.garmentId);
      return slotOf(other?.category) !== slotOf(g?.category);
    });
    write({ ...s, tryOn: [...tryOn, { garmentId, ...fit }] });
  },

  tryOnUpdate(garmentId: string, patch: Partial<TryOnItem>) {
    const s = read();
    write({ ...s, tryOn: s.tryOn.map((t) => t.garmentId === garmentId ? { ...t, ...patch } : t) });
  },
  /** Volta a peça para o encaixe automático. */
  tryOnResetFit(garmentId: string) {
    const s = read();
    const g = s.garments.find((x) => x.id === garmentId);
    const fit = fitFor(g?.category);
    write({
      ...s,
      tryOn: s.tryOn.map((t) => t.garmentId === garmentId
        ? {
            garmentId,
            ...fit,
            x: t.autoX ?? fit.x,
            y: t.autoY ?? fit.y,
            scale: t.autoScale ?? fit.scale,
            height: t.autoHeight,
            rotation: t.autoRotation ?? fit.rotation,
            autoX: t.autoX,
            autoY: t.autoY,
            autoScale: t.autoScale,
            autoHeight: t.autoHeight,
            autoRotation: t.autoRotation,
          }
        : t),
    });
  },

  tryOnRemove(garmentId: string) {
    const s = read();
    write({ ...s, tryOn: s.tryOn.filter((t) => t.garmentId !== garmentId) });
  },
  tryOnClear() {
    const s = read();
    write({ ...s, tryOn: [] });
  },
  tryOnBringToFront(garmentId: string) {
    const s = read();
    const z = (s.tryOn.reduce((m, t) => Math.max(m, t.z), 0) || 0) + 1;
    write({ ...s, tryOn: s.tryOn.map((t) => t.garmentId === garmentId ? { ...t, z } : t) });
  },

  /** Registra atividade: soma XP, atualiza sequência diária e desbloqueia conquistas. */
  track(event: keyof typeof XP_TABLE) {
    const s = read();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const g = s.gamify;
    let streak = g.streak;
    if (g.lastActive !== today) streak = g.lastActive === yesterday ? g.streak + 1 : 1;
    const xp = g.xp + XP_TABLE[event];
    const next: AppState = {
      ...s,
      gamify: { ...g, xp, streak, best: Math.max(g.best, streak), lastActive: today },
    };
    const unlocked = new Set(next.gamify.unlocked);
    ACHIEVEMENTS.forEach((a) => { if (a.test(next)) unlocked.add(a.id); });
    next.gamify.unlocked = [...unlocked];
    write(next);
    return { newlyUnlocked: next.gamify.unlocked.filter((id) => !g.unlocked.includes(id)), streak, xp };
  },

  exportData(): string {

    return JSON.stringify(read(), null, 2);
  },
  wipe() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("stylisme:update"));
  },
};

// Very small "IA" fallback while backend AI is not connected.
// Picks garments matching occasion & style, with sensible slot coverage.
export function generateLook(
  garments: Garment[],
  opts: { occasion?: Occasion; style?: Style; require?: string[]; exclude?: string[]; accessories?: boolean }
): string[] {
  const pool = garments.filter((g) => !opts.exclude?.includes(g.id));
  const scored = pool
    .map((g) => {
      let score = Math.random() * 0.4;
      if (opts.occasion && g.occasions.includes(opts.occasion)) score += 2;
      if (opts.require?.includes(g.id)) score += 10;
      if (g.favorite) score += 0.4;
      score += Math.max(0, 1 - g.wearCount * 0.1);
      return { g, score };
    })
    .sort((a, b) => b.score - a.score);

  const pickBy = (fn: (g: Garment) => boolean) => scored.find((s) => fn(s.g))?.g;

  const chosen: Garment[] = [];
  const top = pickBy((g) => ["Camiseta", "Camisa", "Blusa"].includes(g.category));
  const bottom = pickBy((g) => ["Calça", "Saia", "Shorts"].includes(g.category));
  const dress = pickBy((g) => g.category === "Vestido");
  const shoe = pickBy((g) => g.category === "Sapato");
  const coat = pickBy((g) => g.category === "Casaco");
  const acc = pickBy((g) => g.category === "Acessório");

  if (dress && (!top || !bottom)) chosen.push(dress);
  else {
    if (top) chosen.push(top);
    if (bottom) chosen.push(bottom);
  }
  if (shoe) chosen.push(shoe);
  if (coat && Math.random() > 0.5) chosen.push(coat);
  if (opts.accessories !== false && acc) chosen.push(acc);

  // Ensure required pieces are included
  opts.require?.forEach((id) => {
    if (!chosen.find((c) => c.id === id)) {
      const g = garments.find((x) => x.id === id);
      if (g) chosen.push(g);
    }
  });

  return chosen.map((c) => c.id);
}

// ===== Encaixe automático das peças no corpo (o usuário não ajusta nada) =====
export type BodySlot = "top" | "bottom" | "dress" | "outer" | "shoes" | "acc";

export function slotOf(category?: Category): BodySlot {
  switch (category) {
    case "Camiseta":
    case "Camisa":
    case "Blusa":
      return "top";
    case "Calça":
    case "Saia":
    case "Shorts":
      return "bottom";
    case "Vestido":
      return "dress";
    case "Casaco":
      return "outer";
    case "Sapato":
      return "shoes";
    default:
      return "acc";
  }
}

/**
 * Posição/largura de cada slot — relativas à ÁREA DA FOTO DO CORPO
 * (não ao canvas), para a peça cair no lugar certo em qualquer proporção.
 * x/y = centro da peça, w = largura em fração da largura do corpo.
 */
const SLOT_FIT: Record<BodySlot, { x: number; y: number; w: number; z: number }> = {
  bottom: { x: 0.5, y: 0.66, w: 0.34, z: 1 },
  dress: { x: 0.5, y: 0.47, w: 0.44, z: 2 },
  top: { x: 0.5, y: 0.33, w: 0.42, z: 3 },
  outer: { x: 0.5, y: 0.36, w: 0.5, z: 4 },
  shoes: { x: 0.5, y: 0.96, w: 0.26, z: 5 },
  acc: { x: 0.5, y: 0.1, w: 0.18, z: 6 },
};

export function fitFor(category?: Category): Omit<TryOnItem, "garmentId"> {
  const slot = slotOf(category);
  const f = SLOT_FIT[slot];
  // scale 1 = 40% da largura do corpo
  return { x: f.x, y: f.y, scale: f.w / 0.4, rotation: 0, z: f.z };
}

