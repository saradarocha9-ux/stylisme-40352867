/** Bounds the entire operation, including streamed response bodies. No automatic retries. */
export async function boundedFetch(input: string | URL | Request, init: RequestInit = {}, options: { timeoutMs?: number; maxBytes?: number } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 120_000);
  const abort = () => controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  if (init.signal?.aborted) controller.abort();
  try {
    if (typeof init.body === "string" && new TextEncoder().encode(init.body).byteLength > 16 * 1024 * 1024) {
      throw new Error("As fotos ou os dados são muito grandes. Use imagens menores e tente novamente.");
    }
    const response = await fetch(input, { ...init, signal: controller.signal });
    const maximum = options.maxBytes ?? 32 * 1024 * 1024;
    if (Number(response.headers.get("content-length")) > maximum) {
      await response.body?.cancel();
      throw new Error("O serviço devolveu uma resposta muito grande. Tente novamente.");
    }
    const reader = response.body?.getReader();
    if (!reader) return response;
    const parts: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maximum) {
          await reader.cancel();
          throw new Error("O serviço devolveu uma resposta muito grande. Tente novamente.");
        }
        parts.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    return new Response(size ? bytes : null, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    if (controller.signal.aborted) throw new Error("O serviço demorou para responder. Tente novamente em instantes.");
    throw error;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
  }
}