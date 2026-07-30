import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ColorAnalysis {
  season: string; // ex: "Primavera Brilhante"
  seasonFamily: "Primavera" | "Verão" | "Outono" | "Inverno" | string;
  subtitle: string;
  undertone: string; // Quente / Frio / Neutro
  depth: string; // Clara / Média / Escura
  contrast: string; // Baixo / Médio / Alto
  chroma: string; // Suave / Médio / Brilhante
  skinTone: string;
  hairTone: string;
  eyeTone: string;
  description: string;
  palette: { name: string; hex: string }[];
  avoid: { name: string; hex: string }[];
  metals: string[];
  tips: string[];
}

const PROMPT = `Você é uma consultora de coloração pessoal profissional (análise de 12 estações).
Analise o rosto da pessoa na foto (pele, cabelo, olhos) e responda APENAS com JSON válido, sem markdown:
{
 "season":"uma de: Primavera Brilhante, Primavera Quente, Primavera Clara, Verão Claro, Verão Suave, Verão Frio, Outono Suave, Outono Quente, Outono Profundo, Inverno Frio, Inverno Profundo, Inverno Brilhante",
 "seasonFamily":"Primavera|Verão|Outono|Inverno",
 "subtitle":"frase curta e elegante sobre a cartela",
 "undertone":"Quente|Frio|Neutro",
 "depth":"Clara|Média|Escura",
 "contrast":"Baixo|Médio|Alto",
 "chroma":"Suave|Médio|Brilhante",
 "skinTone":"descrição curta da pele",
 "hairTone":"descrição curta do cabelo",
 "eyeTone":"descrição curta dos olhos",
 "description":"2 a 3 frases explicando a coloração da pessoa em português",
 "palette":[{"name":"nome da cor em português","hex":"#RRGGBB"}] (exatamente 12 cores que valorizam a pessoa),
 "avoid":[{"name":"nome da cor","hex":"#RRGGBB"}] (4 cores a evitar),
 "metals":["Dourado"|"Prateado"|"Rosé"...],
 "tips":["3 a 4 dicas curtas de uso das cores em roupas e maquiagem"]
}`;

export const analyzeColorPalette = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { dataUrl: string }) => {
    if (!data?.dataUrl?.startsWith("data:image/")) throw new Error("Imagem inválida.");
    return data;
  })
  .handler(async ({ data }): Promise<ColorAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("IA indisponível no momento.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: data.dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[analyzeColorPalette] falhou", res.status, text);
      if (res.status === 429) throw new Error("Muitas análises seguidas. Tente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não consegui analisar a sua foto.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inesperada da IA.");
    const p = JSON.parse(match[0]) as Partial<ColorAnalysis>;

    const colors = (v: unknown) =>
      Array.isArray(v)
        ? (v as { name?: string; hex?: string }[])
            .filter((c) => typeof c?.hex === "string" && /^#[0-9a-fA-F]{6}$/.test(c.hex!))
            .map((c) => ({ name: String(c.name ?? ""), hex: c.hex! }))
        : [];

    return {
      season: String(p.season ?? "Estação indefinida"),
      seasonFamily: String(p.seasonFamily ?? "Primavera"),
      subtitle: String(p.subtitle ?? ""),
      undertone: String(p.undertone ?? ""),
      depth: String(p.depth ?? ""),
      contrast: String(p.contrast ?? ""),
      chroma: String(p.chroma ?? ""),
      skinTone: String(p.skinTone ?? ""),
      hairTone: String(p.hairTone ?? ""),
      eyeTone: String(p.eyeTone ?? ""),
      description: String(p.description ?? ""),
      palette: colors(p.palette).slice(0, 12),
      avoid: colors(p.avoid).slice(0, 6),
      metals: Array.isArray(p.metals) ? p.metals.map(String).slice(0, 3) : [],
      tips: Array.isArray(p.tips) ? p.tips.map(String).slice(0, 4) : [],
    };
  });
