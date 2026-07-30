import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ColorAnalysis } from "./color-ai.functions";

export interface SavedAnalysis {
  id: string;
  createdAt: string;
  analysis: ColorAnalysis;
  thumbnail: string | null;
}

export const savePaletteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { analysis: ColorAnalysis; thumbnail?: string | null }) => {
    if (!data?.analysis?.season) throw new Error("Análise inválida.");
    return data;
  })
  .handler(async ({ data, context }): Promise<SavedAnalysis> => {
    const a = data.analysis;
    const { data: row, error } = await context.supabase
      .from("color_analyses")
      .insert({
        user_id: context.userId,
        season: a.season,
        season_family: a.seasonFamily ?? "",
        undertone: a.undertone ?? "",
        depth: a.depth ?? "",
        contrast: a.contrast ?? "",
        chroma: a.chroma ?? "",
        analysis: JSON.parse(JSON.stringify(a)),
        thumbnail: data.thumbnail ?? null,
      })
      .select("id, created_at, analysis, thumbnail")
      .single();

    if (error) {
      console.error("[savePaletteAnalysis]", error);
      throw new Error("Não consegui salvar a análise.");
    }
    return {
      id: row.id,
      createdAt: row.created_at,
      analysis: row.analysis as unknown as ColorAnalysis,
      thumbnail: row.thumbnail,
    };
  });

export const listPaletteAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedAnalysis[]> => {
    const { data, error } = await context.supabase
      .from("color_analyses")
      .select("id, created_at, analysis, thumbnail")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("[listPaletteAnalyses]", error);
      throw new Error("Não consegui carregar o histórico.");
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      analysis: r.analysis as unknown as ColorAnalysis,
      thumbnail: r.thumbnail,
    }));
  });

export const deletePaletteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("Análise inválida.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("color_analyses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) {
      console.error("[deletePaletteAnalysis]", error);
      throw new Error("Não consegui apagar a análise.");
    }
    return { ok: true };
  });
