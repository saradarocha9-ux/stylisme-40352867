import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { LookGarmentBrief } from "./look-ai.functions";

export type DiscoverMode = "own" | "complete" | "explore";
export type Budget = "none" | "low" | "mid" | "high";

export interface DiscoverPrefs {
  styles: string[];
  liked: string[]; // looks visuais marcados "usaria"
  disliked: string[];
  occasion: string;
  budget: Budget;
  comfort: string[]; // conforto, tênis, salto, soltas...
  avoidColors: string;
  trends: "classic" | "new";
}

export interface DiscoverInput {
  mode: DiscoverMode;
  prefs: DiscoverPrefs;
  garments: LookGarmentBrief[];
  palette?: string[];
  feedback?: string[]; // "não combina comigo" anteriores
  tweak?: { kind: "swap" | "cheaper"; base: DiscoverLook };
}

export interface DiscoverLook {
  title: string;
  occasion: string;
  why: string;
  ownedIds: string[];
  toAdd: string[]; // descrições de peças a completar (sem preço, loja ou link)
  alternative: string;
}

const BUDGET_TXT: Record<Budget, string> = {
  none: "NÃO quer comprar agora — proibido sugerir peças novas",
  low: "econômico",
  mid: "intermediário",
  high: "pode investir",
};

export const discoverLooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: DiscoverInput) => {
    if (!d?.prefs || !["own", "complete", "explore"].includes(d.mode)) throw new Error("Pedido inválido.");
    if (d.mode === "own" && (d.garments?.length ?? 0) < 2) throw new Error("Cadastre pelo menos 2 peças para usar o que você tem.");
    return { ...d, garments: (d.garments ?? []).slice(0, 80), feedback: (d.feedback ?? []).slice(-10) };
  })
  .handler(async ({ data }): Promise<DiscoverLook[]> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("IA indisponível no momento.");
    const p = data.prefs;
    const noBuy = p.budget === "none" || data.mode === "own";

    const modeTxt =
      data.mode === "own" ? "Use SOMENTE peças do armário. toAdd deve ser vazio."
      : data.mode === "complete" ? (noBuy ? "Use peças do armário. A pessoa não quer comprar: toAdd vazio." : "Use peças do armário e sugira NO MÁXIMO 1 peça adicional por look em toAdd.")
      : (noBuy ? "Inspiração de estilos novos usando o armário; a pessoa não quer comprar: toAdd vazio." : "Inspirações de estilos novos; podem incluir até 3 peças que a pessoa ainda não possui em toAdd.");

    const tweakTxt = data.tweak
      ? `\nAJUSTE PEDIDO sobre este look: ${JSON.stringify(data.tweak.base)}\n${data.tweak.kind === "swap" ? "Troque UMA peça mantendo o resto, e devolva 1 look." : "Devolva 1 versão mais econômica: priorize peças do armário e reduza peças a comprar."}`
      : "";

    const prompt = `Você é stylist profissional. Monte ${data.tweak ? "1 look" : "3 looks"} em português, nesta ORDEM DE PRIORIDADE:
1. Preferências e conforto: ${p.comfort.join(", ") || "sem restrições"}; estilos: ${p.styles.join(", ") || "não sabe dizer"}; looks que usaria: ${p.liked.join(", ") || "-"}; que NÃO usaria: ${p.disliked.join(", ") || "-"}.
2. Ocasião: ${p.occasion || "livre"}.
3. Orçamento: ${BUDGET_TXT[p.budget]}.
4. Peças disponíveis (JSON): ${JSON.stringify(data.garments)}
5. Cores: evitar "${p.avoidColors || "nenhuma"}"; cartela pessoal (orienta, não proíbe): ${data.palette?.join(", ") || "não informada"}.
6. Tendências: ${p.trends === "new" ? "quer experimentar novidades (descreva como ideia de estilo, NUNCA afirme que algo 'está em alta')" : "prefere combinações clássicas"}.
Feedback anterior "não combina comigo": ${data.feedback?.join(" | ") || "nenhum"}.
MODO: ${modeTxt}${tweakTxt}
Regras: nunca invente ids; nunca cite preços, lojas, links ou estoque; coerência de formalidade, tecido e estação; "alternative" = uma substituição mais econômica ou confortável em 1 frase.
Responda APENAS JSON: {"looks":[{"title":"","occasion":"","why":"relação com as preferências (1-2 frases)","ownedIds":["id"],"toAdd":["descrição da peça"],"alternative":""}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-6-astra", input: prompt }),
    });
    if (!res.ok) {
      console.error("[discoverLooks]", res.status, await res.text());
      if (res.status === 429) throw new Error("Muitas solicitações seguidas. Tente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error("Não consegui montar os looks agora.");
    }
    const json = (await res.json()) as {
      output_text?: string;
      output?: { content?: { type?: string; text?: string }[] }[];
    };
    const text =
      json.output_text ??
      (json.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Resposta inesperada da IA.");
    const parsed = JSON.parse(m[0]) as { looks?: Partial<DiscoverLook>[] };

    // Conferência antes de exibir: peças existem, orçamento e modo respeitados.
    const ids = new Set(data.garments.map((g) => g.id));
    const maxAdd = noBuy ? 0 : data.mode === "complete" ? 1 : 3;
    const out: DiscoverLook[] = [];
    for (const l of parsed.looks ?? []) {
      const ownedIds = [...new Set((l.ownedIds ?? []).map(String).filter((i) => ids.has(i)))];
      const toAdd = (l.toAdd ?? []).map(String).filter(Boolean).slice(0, maxAdd);
      if (ownedIds.length + toAdd.length < 2) continue;
      if (data.mode !== "explore" && ownedIds.length < 1) continue;
      out.push({
        title: String(l.title ?? "Look"),
        occasion: String(l.occasion ?? p.occasion ?? ""),
        why: String(l.why ?? ""),
        ownedIds,
        toAdd,
        alternative: String(l.alternative ?? ""),
      });
      if (out.length === (data.tweak ? 1 : 3)) break;
    }
    if (!out.length) throw new Error("Não encontrei combinações que respeitem suas preferências. Ajuste as escolhas ou cadastre mais peças.");
    return out;
  });
