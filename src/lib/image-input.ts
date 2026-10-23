export const MAX_IMAGE_CHARS = 8 * 1024 * 1024;
export const MAX_BATCH_CHARS = 16 * 1024 * 1024;

export function validateImageDataUrl(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/.test(value)) {
    throw new Error("Imagem inválida. Use uma foto JPEG, PNG ou WebP.");
  }
  if (value.length > MAX_IMAGE_CHARS) throw new Error("Foto muito grande. Use uma imagem menor e tente novamente.");
}