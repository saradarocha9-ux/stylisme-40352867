/** Conta oficial do Stylisme — premium vitalício e vitrine da comunidade. */
export const OFFICIAL_USER_ID = "599e895c-c802-46ef-adba-860a36f5c4bc";
export const OFFICIAL_EMAIL = "stylismeinteligencefyw@gmail.com";

/**
 * Piso de curtidas exibido APENAS nos looks publicados pela conta oficial
 * (tabela look_posts). Não vale para nenhum outro contexto: perfis comuns,
 * XP, estatísticas do armário, paleta ou qualquer contagem real de curtidas.
 */
export const OFFICIAL_LIKES = 10000;

export function isOfficialUser(id?: string | null, email?: string | null) {
  if (id && id === OFFICIAL_USER_ID) return true;
  return !!email && email.toLowerCase() === OFFICIAL_EMAIL;
}

/**
 * Fonte única da verdade para as curtidas mostradas em um look da comunidade.
 * `realLikes` é sempre a contagem verdadeira do banco (já inclui a curtida do
 * usuário atual, contabilizada pelo trigger). O piso é aplicado por cima, sem
 * somar — assim nunca há duplicidade nem contagem que "pula" após recarregar.
 */
export function displayPostLikes(authorId: string, realLikes: number): number {
  const real = Number.isFinite(realLikes) && realLikes > 0 ? Math.floor(realLikes) : 0;
  return isOfficialUser(authorId) ? Math.max(OFFICIAL_LIKES, real) : real;
}
