/**
 * Rede de afiliados
 * ------------------------------------------------------------------
 * Em vez de fechar contrato marca a marca, os anúncios do Stylisme
 * saem por redes de afiliados. Cadastre-se na rede, pegue o seu ID de
 * publisher e coloque abaixo. A partir daí todo clique já sai com o
 * seu link rastreado e a comissão cai na sua conta da rede.
 *
 * Onde pegar o ID:
 *  - Awin (Renner, C&A, Riachuelo, SHEIN, Netshoes...) → ui.awin.com  → "Publisher ID"
 *  - Rakuten Advertising                                → rakutenadvertising.com → "SID"
 *  - Afilio (mercado BR)                                → afilio.com.br → "ID de afiliado"
 *  - Lomadee / Sovrn                                    → painel do afiliado
 *
 * Enquanto o ID estiver vazio, o app usa o link direto da marca
 * (sem comissão), então nada quebra.
 */
export type AffiliateNetwork = "awin" | "rakuten" | "afilio" | "lomadee" | "direct";

export const AFFILIATE_PUBLISHER_IDS: Record<Exclude<AffiliateNetwork, "direct">, string> = {
  awin: "3013819",
  rakuten: "",
  afilio: "",
  lomadee: "",
};

/** Identificador enviado à rede para você conseguir separar a receita por campanha/tela. */
export function buildSubId(campaignId: string, placement: string) {
  return `stylisme_${placement}_${campaignId.slice(0, 8)}`.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Converte a URL da loja no deeplink rastreado da rede de afiliados.
 * Retorna a URL original quando a rede ainda não foi configurada.
 */
export function affiliateLink(params: {
  url: string;
  network?: string | null;
  advertiserId?: string | null;
  campaignId: string;
  placement: string;
}) {
  const { url, advertiserId, campaignId, placement } = params;
  const network = (params.network ?? "direct") as AffiliateNetwork;
  const subId = buildSubId(campaignId, placement);
  const target = encodeURIComponent(url);

  if (network === "direct") return url;
  const publisherId = AFFILIATE_PUBLISHER_IDS[network];
  if (!publisherId || !advertiserId) return url;

  switch (network) {
    case "awin":
      return `https://www.awin1.com/cread.php?awinmid=${advertiserId}&awinaffid=${publisherId}&clickref=${subId}&ued=${target}`;
    case "rakuten":
      return `https://click.linksynergy.com/deeplink?id=${publisherId}&mid=${advertiserId}&u1=${subId}&murl=${target}`;
    case "afilio":
      return `https://afilio.com.br/afiliado/redirect.php?id_afiliado=${publisherId}&id_campanha=${advertiserId}&subid=${subId}&url=${target}`;
    case "lomadee":
      return `https://redir.lomadee.com/v2/deeplink?sourceId=${publisherId}&url=${target}&subid=${subId}`;
    default:
      return url;
  }
}

export function isNetworkConfigured(network?: string | null) {
  if (!network || network === "direct") return false;
  return Boolean(AFFILIATE_PUBLISHER_IDS[network as Exclude<AffiliateNetwork, "direct">]);
}
