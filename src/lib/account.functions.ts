import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const bucket of ["avatars", "looks"] as const) {
      const { data } = await supabaseAdmin.storage.from(bucket).list(context.userId, { limit: 1000 });
      const paths = (data ?? []).filter((item) => item.id).map((item) => `${context.userId}/${item.name}`);
      if (paths.length) await supabaseAdmin.storage.from(bucket).remove(paths);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Não foi possível excluir sua conta agora.");
    return { ok: true };
  });
