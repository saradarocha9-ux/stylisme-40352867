import { toast } from "sonner";
import { actions, ACHIEVEMENTS, type XP_TABLE } from "@/lib/store";
import { celebrate } from "@/lib/haptics";

/** Soma XP, atualiza a sequência e celebra novas conquistas. */
export function track(event: keyof typeof XP_TABLE) {
  const res = actions.track(event);
  res.newlyUnlocked.forEach((id) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    celebrate();
    toast.success(`${a.emoji} Conquista desbloqueada: ${a.title}`, { description: a.desc });
  });
  return res;
}
