import { useSyncExternalStore } from "react";

export const LANGUAGES = [
  { id: "pt", label: "Português" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "fr", label: "Français" },
  { id: "it", label: "Italiano" },
  { id: "ru", label: "Русский" },
  { id: "ko", label: "한국어" },
  { id: "zh", label: "中文" },
] as const;
export type Lang = (typeof LANGUAGES)[number]["id"];

export const CURRENCIES = [
  { id: "brl", label: "Real (R$)", symbol: "R$" },
  { id: "usd", label: "US Dollar (US$)", symbol: "US$" },
  { id: "eur", label: "Euro (€)", symbol: "€" },
] as const;
export type Currency = (typeof CURRENCIES)[number]["id"];

/** Mesmo número em todas as moedas (ex.: 24,90 em R$, US$ e €). */
export function formatMoney(amount: number, currency: Currency, lang: Lang) {
  const locale = { pt: "pt-BR", en: "en-US", es: "es-ES", fr: "fr-FR", it: "it-IT", ru: "ru-RU", ko: "ko-KR", zh: "zh-CN" }[lang];
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}

type Dict = Record<string, string>;
const D: Record<Lang, Dict> = {
  pt: { wardrobe: "Armário", tryon: "Provador", inspire: "Inspire-se", stores: "Lojas", ai: "IA", colors: "Cores", profile: "Perfil", panel: "Painel", language: "Idioma", currency: "Moeda de pagamento", perMonth: "/mês", subscribe: "Assinar Premium", already: "Você já é Premium", redirecting: "Redirecionando…", tagline: "Toda a inteligência do Stylisme, sem limites.", fixed: "Valor fixo · sem surpresas", cancelAny: "Cancele quando quiser · Pagamento seguro via Stripe", back: "Voltar para o Perfil", notInterested: "Não tenho interesse" },
  en: { wardrobe: "Closet", tryon: "Try-on", inspire: "Inspire", stores: "Stores", ai: "AI", colors: "Colors", profile: "Profile", panel: "Panel", language: "Language", currency: "Payment currency", perMonth: "/month", subscribe: "Get Premium", already: "You're already Premium", redirecting: "Redirecting…", tagline: "All of Stylisme's intelligence, without limits.", fixed: "Fixed price · no surprises", cancelAny: "Cancel anytime · Secure payment via Stripe", back: "Back to Profile", notInterested: "Not interested" },
  es: { wardrobe: "Armario", tryon: "Probador", inspire: "Inspírate", stores: "Tiendas", ai: "IA", colors: "Colores", profile: "Perfil", panel: "Panel", language: "Idioma", currency: "Moneda de pago", perMonth: "/mes", subscribe: "Suscribirme a Premium", already: "Ya eres Premium", redirecting: "Redirigiendo…", tagline: "Toda la inteligencia de Stylisme, sin límites.", fixed: "Precio fijo · sin sorpresas", cancelAny: "Cancela cuando quieras · Pago seguro con Stripe", back: "Volver al perfil", notInterested: "No me interesa" },
  fr: { wardrobe: "Garde-robe", tryon: "Cabine", inspire: "Inspiration", stores: "Boutiques", ai: "IA", colors: "Couleurs", profile: "Profil", panel: "Panneau", language: "Langue", currency: "Devise de paiement", perMonth: "/mois", subscribe: "Passer Premium", already: "Vous êtes déjà Premium", redirecting: "Redirection…", tagline: "Toute l'intelligence de Stylisme, sans limites.", fixed: "Prix fixe · sans surprise", cancelAny: "Annulez quand vous voulez · Paiement sécurisé via Stripe", back: "Retour au profil", notInterested: "Pas intéressé" },
  it: { wardrobe: "Armadio", tryon: "Camerino", inspire: "Ispirati", stores: "Negozi", ai: "IA", colors: "Colori", profile: "Profilo", panel: "Pannello", language: "Lingua", currency: "Valuta di pagamento", perMonth: "/mese", subscribe: "Abbonati a Premium", already: "Sei già Premium", redirecting: "Reindirizzamento…", tagline: "Tutta l'intelligenza di Stylisme, senza limiti.", fixed: "Prezzo fisso · nessuna sorpresa", cancelAny: "Disdici quando vuoi · Pagamento sicuro con Stripe", back: "Torna al profilo", notInterested: "Non mi interessa" },
  ru: { wardrobe: "Гардероб", tryon: "Примерка", inspire: "Идеи", stores: "Магазины", ai: "ИИ", colors: "Цвета", profile: "Профиль", panel: "Панель", language: "Язык", currency: "Валюта оплаты", perMonth: "/мес", subscribe: "Оформить Premium", already: "У вас уже Premium", redirecting: "Переход…", tagline: "Весь интеллект Stylisme без ограничений.", fixed: "Фиксированная цена · без сюрпризов", cancelAny: "Отмена в любое время · Безопасная оплата через Stripe", back: "Назад в профиль", notInterested: "Не интересно" },
  ko: { wardrobe: "옷장", tryon: "피팅", inspire: "영감", stores: "스토어", ai: "AI", colors: "컬러", profile: "프로필", panel: "패널", language: "언어", currency: "결제 통화", perMonth: "/월", subscribe: "Premium 구독", already: "이미 Premium입니다", redirecting: "이동 중…", tagline: "Stylisme의 모든 지능을 제한 없이.", fixed: "고정 가격 · 추가 요금 없음", cancelAny: "언제든 해지 · Stripe 안전 결제", back: "프로필로 돌아가기", notInterested: "관심 없음" },
  zh: { wardrobe: "衣橱", tryon: "试衣", inspire: "灵感", stores: "商店", ai: "AI", colors: "色彩", profile: "我的", panel: "面板", language: "语言", currency: "支付货币", perMonth: "/月", subscribe: "订阅 Premium", already: "你已是 Premium", redirecting: "正在跳转…", tagline: "Stylisme 的全部智能，无限使用。", fixed: "固定价格 · 无额外费用", cancelAny: "随时取消 · 通过 Stripe 安全支付", back: "返回我的", notInterested: "不感兴趣" },
};

const KEY = "stylisme:locale";
type State = { lang: Lang; currency: Currency };
const DEFAULT: State = { lang: "pt", currency: "brl" };
let state: State = DEFAULT;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<State> | null;
    if (saved?.lang && D[saved.lang]) state = { lang: saved.lang, currency: saved.currency ?? defaultCurrency(saved.lang) };
  } catch { /* ignore */ }
  document.documentElement.lang = state.lang;
}

export function defaultCurrency(lang: Lang): Currency {
  return lang === "pt" ? "brl" : lang === "en" || lang === "ko" || lang === "zh" || lang === "ru" ? "usd" : "eur";
}

export function setLocale(next: Partial<State>) {
  load();
  state = { ...state, ...next };
  if (next.lang && !next.currency) state.currency = defaultCurrency(next.lang);
  localStorage.setItem(KEY, JSON.stringify(state));
  document.documentElement.lang = state.lang;
  subs.forEach((f) => f());
}

export function useLocale() {
  const s = useSyncExternalStore(
    (f) => { load(); subs.add(f); f(); return () => subs.delete(f); },
    () => { load(); return state; },
    () => DEFAULT,
  );
  const t = (k: keyof (typeof D)["pt"]) => D[s.lang][k] ?? D.pt[k];
  return { ...s, t };
}
