/**
 * Monetização por anúncios do Google
 * ------------------------------------------------------------------
 * AdMob  → só funciona no app NATIVO (Android/iOS empacotado com Capacitor).
 * AdSense → equivalente do AdMob para a versão WEB (navegador/PWA).
 *
 * Os IDs do AdMob já estão configurados. Para a web, preencha
 * `ADSENSE.client` e `ADSENSE.slot` com os dados da sua conta do
 * Google AdSense (o slot é criado em AdSense → Anúncios → Por bloco).
 * Enquanto o slot estiver vazio, o app mostra o chip de afiliados.
 */

export const ADMOB = {
  appId: "ca-app-pub-9364980465425949~8747201165",
  bannerUnitId: "ca-app-pub-9364980465425949/3884208562",
  /** IDs oficiais de teste do Google — use em desenvolvimento. */
  testBannerUnitId: "ca-app-pub-3940256099942544/6300978111",
} as const;

export const ADSENSE = {
  /** Ex.: "ca-pub-9364980465425949" (conta AdSense aprovada). */
  client: "",
  /** ID numérico do bloco de anúncio criado no AdSense. */
  slot: "",
} as const;

export const isAdSenseConfigured = Boolean(ADSENSE.client && ADSENSE.slot);

/** true quando o app roda empacotado como app nativo (Capacitor). */
export function isNativeApp() {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

let admobReady = false;

/**
 * Inicializa e exibe o banner do AdMob no app nativo.
 * Só roda se o plugin @capacitor-community/admob estiver instalado
 * no projeto nativo — na web é ignorado silenciosamente.
 */
export async function showAdMobBanner() {
  if (!isNativeApp()) return false;
  try {
    const moduleName = "@capacitor-community/admob";
    const mod: any = await import(/* @vite-ignore */ moduleName);
    const AdMob = mod.AdMob;
    if (!AdMob) return false;
    if (!admobReady) {
      await AdMob.initialize({ initializeForTesting: false });
      admobReady = true;
    }
    await AdMob.showBanner({
      adId: ADMOB.bannerUnitId,
      adSize: mod.BannerAdSize?.ADAPTIVE_BANNER ?? "ADAPTIVE_BANNER",
      position: mod.BannerAdPosition?.BOTTOM_CENTER ?? "BOTTOM_CENTER",
      margin: 72,
    });
    return true;
  } catch {
    return false;
  }
}

export async function hideAdMobBanner() {
  if (!isNativeApp()) return;
  try {
    const moduleName = "@capacitor-community/admob";
    const mod: any = await import(/* @vite-ignore */ moduleName);
    await mod.AdMob?.removeBanner?.();
  } catch {
    /* noop */
  }
}
