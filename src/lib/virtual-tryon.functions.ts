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

    const garmentList = data.garments
      .map((garment, index) => `${index + 1}. ${garment.name} — ${garment.category}${garment.material ? `, ${garment.material}` : ""}`)
      .join("\n");
    const prompt = `Crie uma fotografia realista de provador virtual. A primeira imagem é a foto-base da pessoa; as imagens seguintes são as peças exatas que devem ser vestidas nela.

PEÇAS:
${garmentList}

Regras obrigatórias:
- preserve exatamente rosto, cabelo, pele, identidade, corpo, pose, mãos, pernas, pés, enquadramento, câmera, iluminação e fundo da foto-base;
- vista somente as peças enviadas, preservando fielmente cor, estampa, textura, material, gola, mangas, costuras, botões, barras e proporções de cada produto;
- adapte o tecido às curvas reais do corpo, perspectiva e pose: ombros, busto, cintura, quadril, braços e pernas;
- produza caimento fisicamente plausível, com dobras, tensão, volume, oclusões e sombras de contato naturais;
- respeite a sobreposição correta entre peças e partes do corpo; mãos, cabelo e acessórios originais devem permanecer à frente quando for fisicamente correto;
- não afine, alargue, alongue ou altere o corpo; não estique a roupa como adesivo; não invente novas peças;
- mantenha a mesma resolução e proporção vertical da foto-base;
- retorne uma única imagem final, sem texto, comparação, moldura ou colagem.`;

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: data.bodyDataUrl } },
      ...data.garments.map((garment) => ({ type: "image_url", image_url: { url: garment.dataUrl } })),
    ];
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Muitas provas seguidas. Aguarde um instante e tente novamente.");
      if (response.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não foi possível gerar o caimento das peças.");
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
    };
    const imageUrl = payload.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl?.startsWith("data:image/")) throw new Error("O provador não retornou uma imagem válida.");
    return { imageUrl };
  });