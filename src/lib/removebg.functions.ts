import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Remove o fundo de uma imagem usando a API do remove.bg.
 * Recebe um data URL (base64) e devolve um PNG transparente em data URL.
 */
export const removeBgRemote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { dataUrl: string }) => {
    if (!data?.dataUrl?.startsWith("data:image/")) {
      throw new Error("Imagem inválida.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<{ dataUrl: string }> => {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) throw new Error("REMOVE_BG_API_KEY não configurada.");

    const base64 = data.dataUrl.split(",")[1] ?? "";

    async function call(size: "auto" | "preview") {
      return fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ image_file_b64: base64, size, format: "png" }),
      });
    }

    let res = await call("auto");
    // Sem créditos pagos: usa as chamadas gratuitas (tamanho preview).
    if (res.status === 402) res = await call("preview");

    if (!res.ok) {
      const text = await res.text();
      console.error("[remove.bg] falhou", res.status, text);
      let detail = "";
      try {
        const parsed = JSON.parse(text) as { errors?: { title?: string }[] };
        detail = parsed.errors?.[0]?.title ?? "";
      } catch { /* texto não-JSON */ }
      if (res.status === 402) throw new Error("Sem créditos nem chamadas gratuitas disponíveis no remove.bg.");
      if (res.status === 403) throw new Error(detail || "Acesso negado pelo remove.bg.");
      throw new Error(detail || "Não foi possível remover o fundo da imagem.");
    }


    const json = (await res.json()) as { data?: { result_b64?: string } };
    const result = json.data?.result_b64;
    if (!result) throw new Error("Resposta inesperada do remove.bg.");

    return { dataUrl: `data:image/png;base64,${result}` };
  });
