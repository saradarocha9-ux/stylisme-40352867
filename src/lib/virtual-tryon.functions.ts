import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";

export interface VirtualTryOnGarment {
  dataUrl: string;
  name: string;
  category: string;
  material?: string;
}

export const generateVirtualTryOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bodyDataUrl: string; garments: VirtualTryOnGarment[] }) => {
    if (!data?.bodyDataUrl?.startsWith("data:image/")) throw new Error("Foto do corpo inválida.");
    if (!Array.isArray(data.garments) || data.garments.length === 0 || data.garments.length > 5) {
      throw new Error("Escolha de uma a cinco peças.");
    }
    if (data.garments.some((garment) => !garment.dataUrl?.startsWith("data:image/"))) {
      throw new Error("Uma das peças possui imagem inválida.");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Provador inteligente indisponível.");

    const layerRank: Record<string, number> = {
      Vestido: 10,
      Calça: 20,
      Saia: 20,
      Shorts: 20,
      Camiseta: 30,
      Camisa: 30,
      Blusa: 30,
      Casaco: 40,
      Sapato: 50,
      Acessório: 60,
    };
    const orderedGarments = [...data.garments].sort(
      (a, b) => (layerRank[a.category] ?? 60) - (layerRank[b.category] ?? 60),
    );
    const garmentList = orderedGarments
      .map((garment, index) => `${index + 1}. ${garment.name} — ${garment.category}${garment.material ? `, ${garment.material}` : ""}`)
      .join("\n");
    const prompt = `Você faz edição local de fotografia para um provador virtual realista. As primeiras ${orderedGarments.length} imagem(ns) são apenas FOTOS DE CATÁLOGO das peças (referência de cor, corte e textura). A ÚLTIMA imagem é a FOTO-BASE: é ela, e somente ela, que deve ser editada e devolvida.

PEÇAS (na ordem em que foram enviadas):
${garmentList}

Regras obrigatórias:
- devolva a FOTO-BASE editada: mesmas dimensões, mesma proporção, mesmo enquadramento, mesma câmera e mesmo fundo, pixel a pixel;
- a pessoa deve continuar exatamente do mesmo tamanho e na mesma posição da FOTO-BASE: nunca reduza, afaste, recentralize ou reenquadre a pessoa;
- é ESTRITAMENTE PROIBIDO colar, sobrepor ou exibir as fotos de catálogo na imagem final: elas não podem aparecer flutuando, ampliadas, no fundo, em miniatura, ao lado ou como colagem. Cada peça só pode existir vestida no corpo da pessoa, uma única vez;
- nunca use a proporção, o fundo ou o enquadramento das fotos de catálogo como base da imagem final;
- preserve exatamente rosto, cabelo, pele, identidade, corpo, curvas, pose, mãos, pernas e pés;
- reproduza fielmente cor, estampa, textura, material, gola, mangas, costuras, botões e barras de cada peça, em escala anatômica correta: cós na cintura ou quadril, barra no comprimento natural, ombros exatamente sobre os ombros da pessoa;
- produza caimento fisicamente plausível, com dobras, tensão, volume, oclusões e sombras de contato naturais;
- respeite esta ordem física de camadas, de dentro para fora: vestido ou parte de baixo; camiseta/camisa/blusa; casaco/blazer; acessórios. Uma saia ou calça NUNCA cobre um blazer/casaco no tronco;
- não afine, alargue, alongue ou altere o corpo; não estique a roupa como adesivo; não invente peças novas;
- retorne uma única imagem final, sem texto, moldura, comparação ou colagem.`;

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: prompt },
      ...orderedGarments.map((garment) => ({ type: "image_url", image_url: { url: garment.dataUrl } })),
      { type: "image_url", image_url: { url: data.bodyDataUrl } },
    ];


    type GatewayPayload = {
      data?: Array<{ b64_json?: string; url?: string }>;
      choices?: Array<{
        message?: {
          content?: unknown;
          images?: Array<{ image_url?: { url?: string } }>;
        };
      }>;
    };

    const extractImage = (payload: GatewayPayload): string | null => {
      const first = payload.data?.[0];
      if (first?.b64_json && first.b64_json.length > 100) return `data:image/png;base64,${first.b64_json}`;
      if (typeof first?.url === "string" && first.url.startsWith("data:image/")) return first.url;

      const message = payload.choices?.[0]?.message;
      const direct = message?.images?.[0]?.image_url?.url;
      if (typeof direct === "string" && direct.startsWith("data:image/")) return direct;
      const raw = message?.content;
      if (typeof raw === "string") {
        const match = raw.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
        if (match) return match[0];
      }
      if (Array.isArray(raw)) {
        for (const part of raw as Array<Record<string, unknown>>) {
          const imageUrl = part.image_url as { url?: unknown } | undefined;
          const inlineDataSnake = part.inline_data as { data?: unknown; mime_type?: unknown } | undefined;
          const inlineDataCamel = part.inlineData as { data?: unknown; mimeType?: unknown } | undefined;
          const url = imageUrl?.url ?? part.url;
          if (typeof url === "string" && url.startsWith("data:image/")) return url;
          const b64 = inlineDataSnake?.data ?? inlineDataCamel?.data ?? part.b64_json;
          if (typeof b64 === "string" && b64.length > 100) {
            const rawMime = inlineDataSnake?.mime_type ?? inlineDataCamel?.mimeType;
            const mime = typeof rawMime === "string" ? rawMime : "image/png";
            return `data:${mime};base64,${b64}`;
          }
        }
      }
      return null;
    };

    const callGateway = async () => {
      // Modelo flash: mesma qualidade de encaixe com resposta em poucos segundos.
      const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image",
          messages: [{ role: "user", content }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Muitas provas seguidas. Aguarde um instante e tente novamente.");
        if (response.status === 402) throw new Error("Créditos de IA esgotados.");
        console.error("try-on gateway error", response.status, (await response.text()).slice(0, 500));
        throw new Error("Não foi possível gerar o caimento das peças.");
      }

      return extractImage((await response.json()) as GatewayPayload);
    };

    // Uma única tentativa: repetir a chamada dobrava o tempo de espera.
    const imageUrl = await callGateway();
    if (!imageUrl) {
      throw new Error("O provador não conseguiu gerar a imagem desta vez. Use uma foto de corpo inteiro, nítida e de frente, e tente novamente.");
    }
    return { imageUrl };
  });
