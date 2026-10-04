export type PartnerTier = "municipal" | "regional" | "nacional";

export const PARTNER_PLANS: Record<PartnerTier, { name: string; priceId: string; year: string; month: string; reach: string }> = {
  municipal: { name: "Parceiro Municipal", priceId: "price_1UMuC2KGRX9cr4A8jXUjnVWj", year: "R$ 1.800/ano", month: "equivale a R$ 150/mês", reach: "Anúncios para 1 cidade" },
  regional: { name: "Parceiro Regional", priceId: "price_1UMuC3KGRX9cr4A85CeHVgbn", year: "R$ 6.000/ano", month: "equivale a R$ 500/mês", reach: "Anúncios para várias cidades" },
  nacional: { name: "Parceiro Nacional", priceId: "price_1UMuC4KGRX9cr4A8c1gET5S5", year: "R$ 18.000/ano", month: "equivale a R$ 1.500/mês", reach: "Anúncios para todo o Brasil" },
};
