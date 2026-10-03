/** Regras únicas dos planos — usadas no provador, planejamento, Premium e ajuda. */
export const FREE_TRYON_DAILY = 3;
export const FREE_PLANNED_LOOKS = 3;

export const PLAN_RULES = {
  free: [
    "Armário digital ilimitado",
    "IA: 3 gerações por dia (até 3 sugestões cada)",
    `Provador no corpo: ${FREE_TRYON_DAILY} provas por dia`,
    `Planejamento: até ${FREE_PLANNED_LOOKS} looks agendados, em lista`,
    "Análise de cores",
    "Com anúncios",
  ],
  premium: [
    "Tudo do Free",
    "IA sem limite diário",
    "Provador no corpo sem limite diário",
    "Planejamento ilimitado com calendário semanal e mensal",
    "Estatísticas do armário (peças esquecidas, cor e categoria mais usadas)",
    "Sem anúncios",
  ],
};

function key() {
  const uid = typeof window === "undefined" ? "" : localStorage.getItem("stylisme:uid") || "guest";
  return `stylisme:tryon:${uid}:${new Date().toISOString().slice(0, 10)}`;
}
export function tryOnUsedToday(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(key()) ?? 0);
}
export function bumpTryOn() {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(), String(tryOnUsedToday() + 1));
}

/** Contador único de gerações de IA (Stylisme AI e Seu próximo look usam o mesmo). */
export const FREE_AI_DAILY = 3;
function aiKey() {
  const uid = typeof window === "undefined" ? "" : localStorage.getItem("stylisme:uid") || "guest";
  return `stylisme:ai:${uid}:${new Date().toISOString().slice(0, 10)}`;
}
export function aiUsedToday(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(aiKey()) ?? 0);
}
export function bumpAi(): number {
  const next = aiUsedToday() + 1;
  if (typeof window !== "undefined") localStorage.setItem(aiKey(), String(next));
  return next;
}
