import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";

export interface DetectedTryOnFit {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  confidence: number;
}

export const detectTryOnFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bodyDataUrl: string; garmentDataUrl: string; category: string }) => {
    if (!data?.bodyDataUrl?.startsWith("data:image/") || !data.garmentDataUrl?.startsWith("data:image/")) {
      throw new Error("Imagens inválidas para o encaixe.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<DetectedTryOnFit> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Encaixe inteligente indisponível.");

    const prompt = `Você é um sistema de visão computacional para sobreposição de roupa em uma foto, não um gerador de imagem. A IMAGEM 1 é a pessoa e a IMAGEM 2 é a peça já recortada e sem margens transparentes, da categoria "${data.category}".

Primeiro localize na IMAGEM 1 os pontos anatômicos visíveis: ombro esquerdo/direito, axilas, cintura, quadril, joelhos, tornozelos e pés. Depois identifique na IMAGEM 2 as aberturas e extremidades reais da peça. Posicione a peça sobre os pontos correspondentes sem cobrir o rosto e SEM deformar sua proporção original.

O resultado deve descrever a caixa VISUAL FINAL da peça sobre a pessoa:
- camiseta/camisa/blusa/casaco: borda superior sobre os ombros; largura externa das mangas coerente com braços e ombros; barra no tronco;
- vestido: parte superior nos ombros e cintura da peça na cintura da pessoa;
- calça/shorts/saia: cós exatamente na cintura/quadril; pernas alinhadas às pernas;
- sapato: centralizado sobre os pés, nunca nos tornozelos ou canelas.

Não use posições médias, presets ou slots. Meça esta pessoa e esta peça específicas. Faça uma checagem final: top, bottom, left e right da caixa devem coincidir com a anatomia correspondente. Retorne SOMENTE um objeto JSON, sem markdown: {"x":0.5,"y":0.4,"width":0.35,"height":0.3,"rotation":0,"confidence":0.9}.
x e y são o CENTRO visual da peça. width e height são frações da largura e altura totais da IMAGEM 1 e representam a caixa final preservando a proporção da IMAGEM 2. rotation vai de -15 a 15 graus.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: data.bodyDataUrl } },
            { type: "image_url", image_url: { url: data.garmentDataUrl } },
          ],
        }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Muitas análises seguidas. Tente novamente.");
      if (response.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não foi possível detectar o encaixe.");
    }

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("A detecção não retornou um encaixe válido.");
    const fit = JSON.parse(match[0]) as Partial<DetectedTryOnFit>;
    const x = Number(fit.x);
    const y = Number(fit.y);
    const width = Number(fit.width);
    const height = Number(fit.height);
    const rotation = Number(fit.rotation);
    const confidence = Number(fit.confidence);

    if (![x, y, width, height].every(Number.isFinite)) throw new Error("Encaixe inválido.");
    if (confidence < 0.45) throw new Error("Não foi possível localizar o corpo com segurança. Use uma foto de corpo inteiro, de frente e bem iluminada.");
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
      width: Math.min(0.9, Math.max(0.08, width)),
      height: Math.min(0.95, Math.max(0.06, height)),
      rotation: Number.isFinite(rotation) ? Math.min(15, Math.max(-15, rotation)) : 0,
      confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.5,
    };
  });