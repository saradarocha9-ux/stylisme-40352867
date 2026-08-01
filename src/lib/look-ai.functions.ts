import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SmartLook {
  title: string;
  why: string;
  garmentIds: string[];
}

export interface LookGarmentBrief {
  id: string;
  name: string;
  category: string;
  color: string;
  material?: string;
  pattern?: string;
  occasions: string[];
  seasons: string[];
}

export interface SmartLookInput {
  garments: LookGarmentBrief[];
  occasion?: string;
  style?: string;
  accessories?: boolean;
  note?: string;
}

export const generateSmartLooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SmartLookInput) => {
    if (!Array.isArray(data?.garments) || data.garments.length < 2)
      throw new Error("Cadastre pelo menos 2 peças no armário.");
    return { ...data, garments: data.garments.slice(0, 80) };
  })
  .handler(async ({ data }): Promise<SmartLook[]> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("IA indisponível no momento.");

    const prompt = `Você é uma stylist profissional de moda com olho crítico. Monte 3 looks REAIS e vestíveis usando SOMENTE as peças do guarda-roupa abaixo.

GUARDA-ROUPA (JSON):
${JSON.stringify(data.garments)}

PEDIDO:
- Ocasião: ${data.occasion ?? "livre"}
- Estilo desejado: ${data.style ?? "livre"}
- Incluir acessórios: ${data.accessories === false ? "não" : "sim, se combinarem"}
${data.note ? `- Observação da pessoa: ${data.note}` : ""}

REGRAS DE COERÊNCIA (obrigatórias — um look que quebre qualquer uma é inválido):
1. Coerência de formalidade: nunca misture peça formal/delicada (renda, cetim, seda, alfaiataria, vestido de festa) com peça esportiva ou pesada demais (jaqueta de couro biker, moletom, tênis de corrida, peça de academia), a não ser que o estilo pedido seja explicitamente "Streetwear" ou "Fashionista" e a combinação seja realmente usada em editoriais.
2. Coerência de material e peso: tecidos leves com leves, pesados com pesados. Não combine tricô grosso com tecido de praia, nem couro com renda.
3. Coerência de estação: não misture peça claramente de inverno com peça claramente de verão.
4. Estrutura correta: cada look = (parte de cima + parte de baixo) OU (vestido), mais sapato quando existir. Casaco só se fizer sentido com a ocasião e a estação. NUNCA duas partes de baixo, nem dois vestidos, nem duas partes de cima concorrentes (exceto camisa por baixo de tricô/casaco).
5. Harmonia de cor: no máximo uma peça estampada por look; equilibre cores neutras e um ponto de cor. Evite choques de cor não intencionais.
6. Adequação à ocasião: academia/praia não usam alfaiataria; trabalho e casamento não usam moletom/peça de academia.
7. Os 3 looks devem ser diferentes entre si. Se o armário não permitir 3 looks coerentes, devolva menos looks — melhor 1 look certo do que 3 errados. NUNCA invente ids.

Responda APENAS com JSON válido, sem markdown:
{"looks":[{"title":"nome curto do look","why":"por que essas peças combinam (1-2 frases em português)","garmentIds":["id","id"]}]}`;

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
      console.error("[generateSmartLooks] falhou", res.status, text);
      if (res.status === 429) throw new Error("Muitas solicitações seguidas. Tente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não consegui montar os looks agora.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta inesperada da IA.");
    const parsed = JSON.parse(match[0]) as { looks?: { title?: string; why?: string; garmentIds?: unknown }[] };

    const byId = new Map(data.garments.map((g) => [g.id, g]));
    const seen = new Set<string>();
    const looks: SmartLook[] = [];

    for (const l of Array.isArray(parsed.looks) ? parsed.looks : []) {
      const ids = (Array.isArray(l?.garmentIds) ? l.garmentIds : [])
        .map(String)
        .filter((id) => byId.has(id));
      // dedup ids e remove duplicidade de categoria estrutural
      const unique: string[] = [];
      const usedSlots = new Set<string>();
      for (const id of ids) {
        if (unique.includes(id)) continue;
        const cat = byId.get(id)!.category;
        const slot =
          ["Camiseta", "Camisa", "Blusa"].includes(cat) ? "top"
          : ["Calça", "Saia", "Shorts"].includes(cat) ? "bottom"
          : cat === "Vestido" ? "dress"
          : cat === "Sapato" ? "shoes"
          : cat === "Casaco" ? "outer"
          : `acc-${unique.length}`;
        if (slot !== "outer" && usedSlots.has(slot)) continue;
        usedSlots.add(slot);
        unique.push(id);
      }
      if (usedSlots.has("dress")) {
        // vestido não convive com top/bottom
        const filtered = unique.filter((id) => {
          const cat = byId.get(id)!.category;
          return !["Camiseta", "Camisa", "Blusa", "Calça", "Saia", "Shorts"].includes(cat);
        });
        unique.length = 0;
        unique.push(...filtered);
      }
      if (unique.length < 2) continue;
      const key = [...unique].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      looks.push({
        title: String(l?.title ?? "Look"),
        why: String(l?.why ?? ""),
        garmentIds: unique,
      });
      if (looks.length === 3) break;
    }

    if (!looks.length) throw new Error("Não encontrei combinações coerentes com essas peças.");
    return looks;
  });
