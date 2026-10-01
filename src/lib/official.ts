/** Conta oficial do Stylisme — premium vitalício e vitrine da comunidade. */
export const OFFICIAL_USER_ID = "599e895c-c802-46ef-adba-860a36f5c4bc";
export const OFFICIAL_EMAIL = "stylismeinteligencefyw@gmail.com";

export function isOfficialUser(id?: string | null, email?: string | null) {
  if (id && id === OFFICIAL_USER_ID) return true;
  return !!email && email.toLowerCase() === OFFICIAL_EMAIL;
}

/**
 * Fonte única da verdade para as curtidas mostradas em um look da comunidade.
 * Retorna sempre a contagem real do banco (já inclui a curtida do usuário
 * atual, contabilizada pelo trigger).
 */
export function displayPostLikes(_authorId: string, realLikes: number): number {
  return Number.isFinite(realLikes) && realLikes > 0 ? Math.floor(realLikes) : 0;
}
