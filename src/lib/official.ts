/** Conta oficial do Stylisme — premium vitalício e vitrine da comunidade. */
export const OFFICIAL_USER_ID = "599e895c-c802-46ef-adba-860a36f5c4bc";
export const OFFICIAL_EMAIL = "stylismeinteligencefyw@gmail.com";

/** Curtidas exibidas nos looks da conta oficial (inclusive nos novos). */
export const OFFICIAL_LIKES = 10000;

export function isOfficialUser(id?: string | null, email?: string | null) {
  if (id && id === OFFICIAL_USER_ID) return true;
  return !!email && email.toLowerCase() === OFFICIAL_EMAIL;
}
