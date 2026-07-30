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

    const prompt = `Atue como um sistema de visão computacional para provador virtual. A IMAGEM 1 é a pessoa e a IMAGEM 2 é uma peça recortada, sem fundo, da categoria "${data.category}".
Analise os pixels visíveis das duas imagens. Na pessoa, localize ombros, axilas, cintura, quadril, joelhos e tornozelos. Na peça, considere sua modelagem, proporção original e limites visíveis. Calcule a CAIXA LIMITE em que a peça inteira cabe SEM ALTERAR SUA PROPORÇÃO, alinhando suas aberturas e costuras aos pontos anatômicos correspondentes.
Regras: camiseta/camisa/blusa começa nos ombros e termina perto da cintura; casaco começa nos ombros; calça começa na cintura e termina nos tornozelos; shorts começa na cintura; saia começa na cintura; vestido começa nos ombros; sapato fica nos pés. Nunca use um slot genérico e nunca cubra o rosto.
Responda SOMENTE JSON válido: {"x":0.5,"y":0.4,"width":0.35,"height":0.3,"rotation":0,"confidence":0.9}.
x e y são o CENTRO da caixa; width e height são os limites máximos da caixa preservando a proporção original da IMAGEM 2. Todos são frações de 0 a 1 relativas à IMAGEM 1 inteira. rotation é em graus, entre -15 e 15.`;

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
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
      width: Math.min(0.9, Math.max(0.08, width)),
      height: Math.min(0.95, Math.max(0.06, height)),
      rotation: Number.isFinite(rotation) ? Math.min(15, Math.max(-15, rotation)) : 0,
      confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0.5,
    };
  });