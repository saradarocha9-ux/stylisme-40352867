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
  .handler(async ({ data }): Promise<{ dataUrl: string; mode: "alpha" | "whitebg" }> => {
    const apiKey: string | undefined = process.env.REMOVE_BG_API_KEY;
    const base64 = data.dataUrl.split(",")[1] ?? "";

    if (apiKey) {
      const key: string = apiKey;
      async function call(size: "auto" | "preview") {
        return fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: {
            "X-Api-Key": key,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ image_file_b64: base64, size, format: "png" }),
        });
      }

      let res = await call("auto");
      // Sem créditos pagos: usa as chamadas gratuitas (tamanho preview).
      if (res.status === 402) res = await call("preview");

      if (res.ok) {
        const json = (await res.json()) as { data?: { result_b64?: string } };
        const result = json.data?.result_b64;
        if (result) return { dataUrl: `data:image/png;base64,${result}`, mode: "alpha" };
      } else {
        console.error("[remove.bg] falhou", res.status, (await res.text()).slice(0, 300));
      }
    }

    // Alternativa: recorte por IA, devolvendo a peça sobre fundo branco puro
    // (o cliente converte o branco em transparência).
    const aiKey = process.env.LOVABLE_API_KEY;
    if (!aiKey) throw new Error("Não foi possível remover o fundo da imagem.");

    const prompt = `Recorte APENAS a peça de roupa/calçado/acessório principal desta foto e devolva-a isolada sobre um fundo BRANCO PURO (#FFFFFF), totalmente uniforme, sem sombras, sem reflexos, sem gradientes e sem qualquer outro objeto, pessoa, mão, cabide, texto ou moldura.
Regras: preserve exatamente a cor, a estampa, a textura, o formato e todos os detalhes da peça; não redesenhe, não estilize, não corte partes da peça; mantenha a peça inteira, centralizada, ocupando a maior parte do quadro; nenhuma parte branca da própria peça pode ser apagada — mantenha suas bordas nítidas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.dataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Muitas imagens seguidas. Aguarde um instante e tente novamente.");
      if (response.status === 402) throw new Error("Créditos de IA esgotados.");
      console.error("[bg-ai] erro", response.status, (await response.text()).slice(0, 300));
      throw new Error("Não foi possível remover o fundo da imagem.");
    }

    type Payload = {
      data?: Array<{ b64_json?: string; url?: string }>;
      choices?: Array<{ message?: { content?: unknown; images?: Array<{ image_url?: { url?: string } }> } }>;
    };
    const payload = (await response.json()) as Payload;
    const first = payload.data?.[0];
    let out: string | null = null;
    if (first?.b64_json && first.b64_json.length > 100) out = `data:image/png;base64,${first.b64_json}`;
    else if (typeof first?.url === "string" && first.url.startsWith("data:image/")) out = first.url;
    else {
      const message = payload.choices?.[0]?.message;
      const direct = message?.images?.[0]?.image_url?.url;
      if (typeof direct === "string" && direct.startsWith("data:image/")) out = direct;
      else if (typeof message?.content === "string") {
        const match = message.content.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
        if (match) out = match[0];
      }
    }
    if (!out) throw new Error("Não foi possível remover o fundo da imagem.");
    return { dataUrl: out, mode: "whitebg" };
  });

