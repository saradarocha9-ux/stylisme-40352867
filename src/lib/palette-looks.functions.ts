import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ColorAnalysis } from "./color-ai.functions";

export interface PaletteLook {
  title: string;
  why: string;
  garmentIds: string[];
  colors: { name: string; hex: string }[];
}

export interface WardrobeVerdict {
  garmentId: string;
  verdict: "ideal" | "neutra" | "evitar";
  reason: string;
}

export interface PaletteRecommendation {
  headline: string;
  looks: PaletteLook[];
  wardrobe: WardrobeVerdict[];
  shoppingColors: { name: string; hex: string; reason: string }[];
}

export interface GarmentBrief {
  id: string;
  name: string;
  category: string;
  color: string;
  material?: string;
  pattern?: string;
  occasions: string[];
  seasons: string[];
}

export const recommendFromPalette = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { analysis: ColorAnalysis; garments: GarmentBrief[] }) => {
    if (!data?.analysis?.season) throw new Error("Faça a análise de cores primeiro.");
    if (!Array.isArray(data.garments) || data.garments.length === 0)
      throw new Error("Cadastre peças no armário para receber recomendações.");
    return { analysis: data.analysis, garments: data.garments.slice(0, 60) };
  })
  .handler(async ({ data }): Promise<PaletteRecommendation> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("IA indisponível no momento.");

    const { analysis, garments } = data;
    const prompt = `Você é uma consultora de imagem e coloração pessoal.

CARTELA DA PESSOA:
- Estação: ${analysis.season} (${analysis.seasonFamily})
- Subtom: ${analysis.undertone} | Profundidade: ${analysis.depth} | Contraste: ${analysis.contrast} | Intensidade: ${analysis.chroma}
- Cores ideais: ${analysis.palette.map((c) => `${c.name} ${c.hex}`).join(", ")}
- Cores a evitar: ${analysis.avoid.map((c) => `${c.name} ${c.hex}`).join(", ")}
- Metais: ${analysis.metals.join(", ")}

GUARDA-ROUPA (JSON):
${JSON.stringify(garments)}

Monte de 3 a 4 looks usando SOMENTE ids reais do guarda-roupa, priorizando peças nas cores ideais e combinações harmônicas (cada look deve ter partes de cima e de baixo, ou vestido, e sapato quando existir). Classifique CADA peça do guarda-roupa em relação à cartela. Sugira 4 cores que faltam no armário.

Responda APENAS com JSON válido, sem markdown:
{
 "headline":"frase curta em português sobre o guarda-roupa e a cartela",
 "looks":[{"title":"nome curto do look","why":"por que combina com a cartela (1-2 frases)","garmentIds":["id"],"colors":[{"name":"cor","hex":"#RRGGBB"}]}],
 "wardrobe":[{"garmentId":"id","verdict":"ideal|neutra|evitar","reason":"motivo curto"}],
 "shoppingColors":[{"name":"cor","hex":"#RRGGBB","reason":"motivo curto"}]
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[recommendFromPalette] falhou", res.status, text);
      if (res.status === 429) throw new Error("Muitas solicitações seguidas. Tente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não consegui gerar as recomendações.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inesperada da IA.");
    const p = JSON.parse(match[0]) as Partial<PaletteRecommendation>;

    const ids = new Set(garments.map((g) => g.id));
    const colors = (v: unknown) =>
      Array.isArray(v)
        ? (v as { name?: string; hex?: string }[])
            .filter((c) => typeof c?.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(c.hex!))
            .map((c) => ({ name: String(c.name ?? ""), hex: c.hex! }))
        : [];

    const looks: PaletteLook[] = (Array.isArray(p.looks) ? p.looks : [])
      .map((l) => ({
        title: String(l?.title ?? "Look"),
        why: String(l?.why ?? ""),
        garmentIds: (Array.isArray(l?.garmentIds) ? l.garmentIds : []).map(String).filter((id) => ids.has(id)),
        colors: colors(l?.colors).slice(0, 4),
      }))
      .filter((l) => l.garmentIds.length > 0)
      .slice(0, 4);

    const wardrobe: WardrobeVerdict[] = (Array.isArray(p.wardrobe) ? p.wardrobe : [])
      .map((w) => ({
        garmentId: String(w?.garmentId ?? ""),
        verdict: (["ideal", "neutra", "evitar"] as const).includes(w?.verdict as never)
          ? (w!.verdict as WardrobeVerdict["verdict"])
          : "neutra",
        reason: String(w?.reason ?? ""),
      }))
      .filter((w) => ids.has(w.garmentId));

    return {
      headline: String(p.headline ?? ""),
      looks,
      wardrobe,
      shoppingColors: (Array.isArray(p.shoppingColors) ? p.shoppingColors : [])
        .filter((c) => typeof c?.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(c.hex))
        .map((c) => ({ name: String(c.name ?? ""), hex: c.hex, reason: String(c.reason ?? "") }))
        .slice(0, 4),
    };
  });
