import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface GarmentAnalysis {
  name: string;
  category: string;
  color: string;
  material: string;
  pattern: string;
  occasions: string[];
  seasons: string[];
}

const PROMPT = `Você é um estilista. Analise a peça de roupa na imagem e responda APENAS com JSON válido, sem markdown, no formato:
{"name":"nome curto em português","category":"uma de: Camiseta, Camisa, Blusa, Vestido, Saia, Calça, Shorts, Casaco, Sapato, Acessório","color":"cor principal em português","material":"tecido provável (ex: Algodão, Linho, Jeans, Couro, Malha, Seda, Poliéster)","pattern":"estampa (Lisa, Listrada, Xadrez, Floral, Poá, Animal print...)","occasions":["subconjunto de: Trabalho, Faculdade, Casual, Festa, Casamento, Viagem, Evento, Academia, Praia, Jantar"],"seasons":["subconjunto de: Verão, Outono, Inverno, Primavera"]}`;

/** Detecta automaticamente categoria, cor, material, estampa e usos de uma peça. */
export const analyzeGarment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { dataUrl: string }) => {
    if (!data?.dataUrl?.startsWith("data:image/")) throw new Error("Imagem inválida.");
    return data;
  })
  .handler(async ({ data }): Promise<GarmentAnalysis> => {
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
      console.error("[analyzeGarment] falhou", res.status, text);
      if (res.status === 429) throw new Error("Muitas análises seguidas. Tente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não consegui analisar a peça.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inesperada da IA.");
    const parsed = JSON.parse(match[0]) as Partial<GarmentAnalysis>;

    return {
      name: String(parsed.name ?? "").slice(0, 60),
      category: String(parsed.category ?? ""),
      color: String(parsed.color ?? ""),
      material: String(parsed.material ?? ""),
      pattern: String(parsed.pattern ?? ""),
      occasions: Array.isArray(parsed.occasions) ? parsed.occasions.map(String) : [],
      seasons: Array.isArray(parsed.seasons) ? parsed.seasons.map(String) : [],
    };
  });
