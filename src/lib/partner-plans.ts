export type PartnerTier = "municipal" | "regional" | "nacional";
export type PartnerBilling = "monthly" | "yearly";

export const PARTNER_PLANS: Record<PartnerTier, { name: string; priceId: string; monthlyPriceId: string; year: string; month: string; monthly: string; reach: string }> = {
  municipal: { name: "Parceiro Municipal", priceId: "price_1UMuC2KGRX9cr4A8jXUjnVWj", monthlyPriceId: "price_1UMvWFKGRX9cr4A8zvQimx3c", year: "R$ 1.800/ano", month: "equivale a R$ 150/mês", monthly: "R$ 180/mês", reach: "Anúncios para 1 cidade" },
  regional: { name: "Parceiro Regional", priceId: "price_1UMuC3KGRX9cr4A85CeHVgbn", monthlyPriceId: "price_1UMvWGKGRX9cr4A8Ega9jPtP", year: "R$ 6.000/ano", month: "equivale a R$ 500/mês", monthly: "R$ 600/mês", reach: "Anúncios para várias cidades" },
  nacional: { name: "Parceiro Nacional", priceId: "price_1UMuC4KGRX9cr4A8c1gET5S5", monthlyPriceId: "price_1UMvWHKGRX9cr4A8LaTISAPq", year: "R$ 18.000/ano", month: "equivale a R$ 1.500/mês", monthly: "R$ 1.800/mês", reach: "Anúncios para todo o Brasil" },
};
