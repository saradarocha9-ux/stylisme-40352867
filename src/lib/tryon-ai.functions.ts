import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";

export interface DetectedTryOnFit {
  x: number;
  y: number;
  width: number;
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

    const prompt = `Você é um sistema de visão computacional para provador virtual. A primeira imagem é uma pessoa de corpo inteiro e a segunda é uma peça sem fundo da categoria "${data.category}".
Detecte na PRIMEIRA imagem a cabeça, ombros, tórax, cintura, quadril, joelhos, tornozelos e os limites reais da silhueta. Depois determine onde a SEGUNDA imagem deve ser sobreposta para vestir essa pessoa.
Responda APENAS JSON válido: {"x":0.5,"y":0.35,"width":0.42,"confidence":0.9}.
x e y são o centro da peça, normalizados de 0 a 1 na primeira imagem. width é a largura da peça em relação à largura total da primeira imagem. Considere o corte e a proporção reais da peça, não use posições genéricas. A peça deve cobrir exatamente a região anatômica correspondente, sem cobrir rosto ou áreas erradas.`;

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
    const confidence = Number(fit.confidence);

    if (![x, y, width].every(Number.isFinite)) throw new Error("Encaixe inválido.");
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
      width: Math.min(0.9, Math.max(0.08, width)),
      confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.5,
    };
  });