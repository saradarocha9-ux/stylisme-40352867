import { ACHIEVEMENTS } from "@/lib/store";

export function Achievements({ unlocked }: { unlocked: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ACHIEVEMENTS.map((a) => {
        const on = unlocked.includes(a.id);
        return (
          <div
            key={a.id}
            title={`${a.title} — ${a.desc}`}
            className={
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border p-1 text-center transition " +
              (on ? "border-gold/40 bg-card shadow-soft" : "border-dashed border-border opacity-40")
            }
          >
            <span className={"text-xl " + (on ? "" : "grayscale")}>{a.emoji}</span>
            <span className="line-clamp-2 text-[8px] uppercase leading-tight tracking-[0.1em] text-muted-foreground">
              {a.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}
