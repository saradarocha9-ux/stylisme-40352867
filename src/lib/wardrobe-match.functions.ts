import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface MatchPiece {
  lookPiece: string;
  garmentId: string | null;
  similarity: number; // 0..100
  reason: string;
}

export interface WardrobeMatch {
  headline: string;
  matches: MatchPiece[];
  missing: { piece: string; tip: string }[];
}

export interface MatchInput {
  lookGarments: { name: string; category: string; color: string; material?: string; pattern?: string }[];
  lookTitle?: string;
  wardrobe: { id: string; name: string; category: string; color: string; material?: string; pattern?: string }[];
}

export const matchWardrobe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: MatchInput) => {
    if (!Array.isArray(data?.lookGarments) || data.lookGarments.length === 0)
      throw new Error("Esse look não tem peças descritas.");
    if (!Array.isArray(data?.wardrobe) || data.wardrobe.length === 0)
      throw new Error("Cadastre peças no seu armário para comparar.");
    return { ...data, wardrobe: data.wardrobe.slice(0, 80), lookGarments: data.lookGarments.slice(0, 10) };
  })
  .handler(async ({ data }): Promise<WardrobeMatch> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("IA indisponível no momento.");

    const prompt = `Você é uma consultora de moda. Compare as peças de um look de outra pessoa com o guarda-roupa de quem está olhando e diga o que ela já tem de parecido.

LOOK${data.lookTitle ? ` "${data.lookTitle}"` : ""} (peças):
${JSON.stringify(data.lookGarments)}

GUARDA-ROUPA DA PESSOA (JSON com ids reais):
${JSON.stringify(data.wardrobe)}

REGRAS:
- Para cada peça do look, encontre a peça MAIS parecida do guarda-roupa (mesma categoria, cor próxima, material e caimento parecidos).
- similarity de 0 a 100. Se nada do armário for razoavelmente parecido (abaixo de 40), use garmentId null.
- NUNCA invente ids: use apenas ids que existem no guarda-roupa.
- Liste em "missing" as peças do look que a pessoa não tem, com uma dica curta do que comprar/substituir.
- Português do Brasil, tom simpático e direto.

Responda APENAS com JSON válido, sem markdown:
{"headline":"frase curta dizendo o quanto dá para recriar o look","matches":[{"lookPiece":"nome da peça do look","garmentId":"id ou null","similarity":0,"reason":"por que é parecida (1 frase)"}],"missing":[{"piece":"peça que falta","tip":"dica curta"}]}`;

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
      console.error("[matchWardrobe] falhou", res.status, text);
      if (res.status === 429) throw new Error("Muitas solicitações seguidas. Tente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não consegui comparar com o seu armário agora.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const found = raw.match(/\{[\s\S]*\}/);
    if (!found) throw new Error("Resposta inesperada da IA.");
    const parsed = JSON.parse(found[0]) as Partial<WardrobeMatch>;

    const ids = new Set(data.wardrobe.map((g) => g.id));
    const matches: MatchPiece[] = (Array.isArray(parsed.matches) ? parsed.matches : []).map((m) => {
      const id = m?.garmentId && ids.has(String(m.garmentId)) ? String(m.garmentId) : null;
      const sim = Math.max(0, Math.min(100, Number(m?.similarity) || 0));
      return {
        lookPiece: String(m?.lookPiece ?? "Peça"),
        garmentId: id,
        similarity: id ? sim : 0,
        reason: String(m?.reason ?? ""),
      };
    });

    return {
      headline: String(parsed.headline ?? ""),
      matches,
      missing: (Array.isArray(parsed.missing) ? parsed.missing : []).map((m) => ({
        piece: String(m?.piece ?? ""),
        tip: String(m?.tip ?? ""),
      })).filter((m) => m.piece),
    };
  });
