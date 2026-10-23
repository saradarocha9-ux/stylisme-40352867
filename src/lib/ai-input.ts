/** Bound text-only requests independently of the image transport limits. */
export function validateAiTextInput(data: unknown) {
  if (JSON.stringify(data).length > 256 * 1024) throw new Error("Há muitos dados neste pedido. Reduza as informações e tente novamente.");
}