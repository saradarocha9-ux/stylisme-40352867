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
}

export interface TryOnItem {
  garmentId: string;
  x: number; // 0..1 (relative to canvas)
  y: number; // 0..1
  scale: number; // 1 = 40% of canvas width
  rotation: number; // deg
  z: number;
}

interface AppState {
  garments: Garment[];
  looks: Look[];
  plans: Plan[];
  profile: Profile;
  tryOn: TryOnItem[];
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

const initial: AppState = {
  garments: [],
  looks: [],
  plans: [],
  profile: defaultProfile,
  tryOn: [],
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
