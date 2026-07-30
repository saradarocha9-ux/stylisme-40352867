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
    const prompt = `Edite localmente a primeira fotografia para criar um provador virtual realista. A primeira imagem é a FOTO-BASE imutável; as imagens seguintes são as peças exatas que devem ser vestidas nela.

PEÇAS:
${garmentList}

Regras obrigatórias:
- preserve pixel a pixel todo o fundo original da FOTO-BASE; não remova, clareie, substitua, recorte, estenda ou transforme o fundo em branco;
- mantenha exatamente as dimensões, proporção, enquadramento e câmera da FOTO-BASE;
- a caixa ocupada pela pessoa deve permanecer na mesma posição e com exatamente a mesma altura e largura: não diminua, amplie, desloque ou reenquadre a pessoa;
- preserve exatamente rosto, cabelo, pele, identidade, corpo, curvas, pose, mãos, pernas e pés;
- vista somente as peças enviadas, preservando fielmente cor, estampa, textura, material, gola, mangas, costuras, botões, barras e proporções de cada produto;
- adapte cada peça à anatomia correspondente sem exagerar seu tamanho: cós de saia/calça na cintura ou quadril, barra no comprimento natural, ombros de blazer exatamente sobre os ombros da pessoa;
- produza caimento fisicamente plausível, com dobras, tensão, volume, oclusões e sombras de contato naturais;
- respeite esta ordem física de camadas, de dentro para fora: vestido ou parte de baixo; camiseta/camisa/blusa; casaco/blazer; acessórios. Uma saia ou calça NUNCA pode cobrir um blazer/casaco na região do tronco. O blazer fica visualmente por cima da cintura e do topo da saia, exceto se estiver claramente aberto;
- mãos, cabelo e acessórios originais devem permanecer à frente quando for fisicamente correto;
- não afine, alargue, alongue ou altere o corpo; não estique a roupa como adesivo; não invente novas peças;
- cada peça enviada deve aparecer UMA ÚNICA VEZ, vestida no corpo: é proibido duplicar, repetir, espelhar ou mostrar cópias da mesma peça soltas, ao lado, no fundo ou em miniatura;
- mantenha a mesma resolução e proporção vertical da foto-base;
- retorne uma única imagem final, sem texto, comparação, moldura ou colagem.`;

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: data.bodyDataUrl } },
      ...orderedGarments.map((garment) => ({ type: "image_url", image_url: { url: garment.dataUrl } })),
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
        for (const part of raw as Array<Record<string, any>>) {
          const url = part?.image_url?.url ?? part?.url;
          if (typeof url === "string" && url.startsWith("data:image/")) return url;
          const b64 = part?.inline_data?.data ?? part?.inlineData?.data ?? part?.b64_json;
          if (typeof b64 === "string" && b64.length > 100) {
            const mime = part?.inline_data?.mime_type ?? part?.inlineData?.mimeType ?? "image/png";
            return `data:${mime};base64,${b64}`;
          }
        }
      }
      return null;
    };

    const callGateway = async () => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image",
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

    let imageUrl = await callGateway();
    if (!imageUrl) imageUrl = await callGateway();
    if (!imageUrl) {
      throw new Error("O provador não conseguiu gerar a imagem desta vez. Use uma foto de corpo inteiro, nítida e de frente, e tente novamente.");
    }
    return { imageUrl };
  });
