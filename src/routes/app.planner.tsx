import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Crown, Lock, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { useSubscription } from "@/hooks/use-subscription";
import { FREE_PLANNED_LOOKS } from "@/lib/plan-limits";

export const Route = createFileRoute("/app/planner")({
  head: () => ({ meta: [{ title: "Planejamento de looks — Stylisme" }, { name: "description", content: "Organize seus looks por data no calendário Stylisme." }, { property: "og:title", content: "Planejamento de looks — Stylisme" }, { property: "og:description", content: "Organize seus looks por data no calendário Stylisme." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PlannerPage,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);
const WEEK = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function PlannerPage() {
  const { state } = useStore();
  const { isPremium } = useSubscription();
  const today = iso(new Date());
  const [date, setDate] = useState(today);
  const [lookId, setLookId] = useState(state.looks[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [view, setView] = useState<"list" | "week" | "month">("list");
  const plans = useMemo(() => [...state.plans].sort((a, b) => a.date.localeCompare(b.date)), [state.plans]);
  const upcoming = plans.filter((p) => p.date >= today);
  const atLimit = !isPremium && upcoming.length >= FREE_PLANNED_LOOKS;

  function add() {
    if (!date || atLimit) return;
    actions.addPlan({ date, lookId: lookId || undefined, note: note.trim() || undefined });
    setNote("");
  }

  return (
    <div className="px-5 pt-8">
      <Link to="/app/profile" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><ArrowLeft size={14} /> Perfil</Link>
      <p className="mt-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Organize sua semana</p>
      <h1 className="font-display text-3xl">Planejamento</h1>

      <div className="mt-4 rounded-2xl border border-border p-4 text-xs text-muted-foreground">
        {isPremium
          ? "Premium: looks agendados sem limite, com calendário semanal e mensal."
          : <>Free: até {FREE_PLANNED_LOOKS} looks agendados, em lista ({upcoming.length}/{FREE_PLANNED_LOOKS} usados). O calendário semanal e mensal e o planejamento ilimitado são Premium. <Link to="/app/premium" className="text-gold underline">Ver Premium</Link></>}
      </div>

      <section className="mt-5 border-y border-border py-5">
        {atLimit ? (
          <div className="py-4 text-center text-sm">
            <Lock className="mx-auto text-gold" size={22} />
            <p className="mt-2">Você atingiu os {FREE_PLANNED_LOOKS} looks agendados do plano Free.</p>
            <p className="mt-1 text-xs text-muted-foreground">Remova um planejamento ou assine para agendar sem limite.</p>
            <Link to="/app/premium" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs text-[oklch(0.16_0.01_60)]"><Crown size={14} /> Assinar Premium</Link>
          </div>
        ) : (
          <>
            <label className="block text-xs text-muted-foreground">Data<input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm" /></label>
            <label className="mt-4 block text-xs text-muted-foreground">Look<select value={lookId} onChange={(e) => setLookId(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"><option value="">Decidir depois</option>{state.looks.map((look) => <option key={look.id} value={look.id}>{look.name}</option>)}</select></label>
            <label className="mt-4 block text-xs text-muted-foreground">Ocasião ou lembrete<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: reunião às 9h" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm" /></label>
            <button onClick={add} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm text-primary-foreground"><Plus size={15} /> Planejar look</button>
          </>
        )}
      </section>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {(["list", "week", "month"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={"rounded-full border py-2 text-xs " + (view === v ? "border-foreground bg-foreground text-primary-foreground" : "border-border")}>
            {v === "list" ? "Lista" : v === "week" ? "Semana" : "Mês"}{v !== "list" && !isPremium ? " ✦" : ""}
          </button>
        ))}
      </div>

      {view === "list" && (
        <div className="mt-4 space-y-3">
          {plans.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><CalendarDays className="mx-auto" /><p className="mt-3 text-sm">Nenhum look planejado.</p></div>
          ) : plans.map((plan) => {
            const look = state.looks.find((item) => item.id === plan.lookId);
            return (
              <article key={plan.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gold">{new Date(`${plan.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}</p>
                  <p className="mt-1 text-sm font-medium">{look?.name ?? "Look a decidir"}</p>
                  {plan.note && <p className="text-xs text-muted-foreground">{plan.note}</p>}
                </div>
                <button onClick={() => actions.removePlan(plan.id)} aria-label="Remover planejamento" className="p-2 text-destructive"><Trash2 size={16} /></button>
              </article>
            );
          })}
        </div>
      )}

      {view !== "list" && (
        <div className="relative mt-4">
          {!isPremium && <p className="mb-2 text-center text-[10px] uppercase tracking-[0.24em] text-gold">Prévia de demonstração — recurso Premium</p>}
          <Calendar mode={view} plans={isPremium ? plans : demoPlans(today)} looks={state.looks} />
          {!isPremium && (
            <div className="mt-4 text-center">
              <Link to="/app/premium" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs text-[oklch(0.16_0.01_60)]"><Crown size={14} /> Desbloquear calendário</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type P = { id: string; date: string; lookId?: string; note?: string };

function demoPlans(today: string): P[] {
  const base = new Date(`${today}T12:00:00`);
  const notes = ["Reunião", "Jantar", "Academia", "Viagem"];
  return notes.map((note, i) => { const d = new Date(base); d.setDate(d.getDate() + i * 2 + 1); return { id: `demo-${i}`, date: iso(d), note }; });
}

function Calendar({ mode, plans, looks }: { mode: "week" | "month"; plans: P[]; looks: { id: string; name: string }[] }) {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const days: (Date | null)[] = [];
  if (mode === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  } else {
    const first = new Date(now.getFullYear(), now.getMonth(), 1, 12);
    for (let i = 0; i < (first.getDay() + 6) % 7; i++) days.push(null);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i++) days.push(new Date(now.getFullYear(), now.getMonth(), i, 12));
  }
  return (
    <div className="rounded-2xl bg-card p-3 shadow-soft">
      {mode === "month" && <p className="mb-2 text-center text-sm capitalize">{now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <span key={i} />;
          const day = plans.filter((p) => p.date === iso(d));
          return (
            <div key={i} className={"rounded-lg border p-1 text-left " + (mode === "week" ? "min-h-24" : "min-h-12") + (iso(d) === iso(now) ? " border-gold" : " border-border")}>
              <p className="text-[10px]">{d.getDate()}</p>
              {day.map((p) => <p key={p.id} className="mt-0.5 truncate rounded bg-gold/20 px-1 text-[9px]">{looks.find((l) => l.id === p.lookId)?.name ?? p.note ?? "Look"}</p>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
