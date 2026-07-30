import { Flame, Sparkles } from "lucide-react";
import { levelOf, type Gamify } from "@/lib/store";

export function StreakCard({ gamify, compact }: { gamify: Gamify; compact?: boolean }) {
  const lv = levelOf(gamify.xp);
  const today = new Date().toISOString().slice(0, 10);
  const active = gamify.lastActive === today;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-soft">
        <Flame size={13} className={active ? "text-gold" : "text-muted-foreground"} />
        <span className="tabular-nums">{gamify.streak}</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-premium p-5 text-white shadow-lift">
      <div className="aurora pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] opacity-70">Nível {lv.level} · {lv.name}</p>
          <p className="font-display text-3xl leading-tight">
            {gamify.streak} {gamify.streak === 1 ? "dia" : "dias"} de estilo
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <Flame size={24} className="text-gold" />
        </div>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${lv.progress * 100}%` }} />
      </div>
      <div className="relative mt-2 flex items-center justify-between text-[11px] opacity-70">
        <span className="inline-flex items-center gap-1"><Sparkles size={11} /> {gamify.xp} XP</span>
        <span>{lv.next ? `${lv.next.min - gamify.xp} XP para ${lv.next.name}` : "Nível máximo"}</span>
      </div>
    </div>
  );
}
