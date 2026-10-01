import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/app/planner")({
  head: () => ({ meta: [{ title: "Planejamento de looks — Stylisme" }, { name: "description", content: "Organize seus looks por data no calendário Stylisme." }, { property: "og:title", content: "Planejamento de looks — Stylisme" }, { property: "og:description", content: "Organize seus looks por data no calendário Stylisme." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PlannerPage,
});

function PlannerPage() {
  const { state } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [lookId, setLookId] = useState(state.looks[0]?.id ?? "");
  const [note, setNote] = useState("");
  const plans = useMemo(() => [...state.plans].sort((a, b) => a.date.localeCompare(b.date)), [state.plans]);
  function add() { if (!date) return; actions.addPlan({ date, lookId: lookId || undefined, note: note.trim() || undefined }); setNote(""); }
  return <div className="px-5 pt-8"><Link to="/app/profile" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><ArrowLeft size={14} /> Perfil</Link><p className="mt-5 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Organize sua semana</p><h1 className="font-display text-3xl">Planejamento</h1><section className="mt-6 border-y border-border py-5"><label className="block text-xs text-muted-foreground">Data<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm" /></label><label className="mt-4 block text-xs text-muted-foreground">Look<select value={lookId} onChange={(e) => setLookId(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm"><option value="">Decidir depois</option>{state.looks.map((look) => <option key={look.id} value={look.id}>{look.name}</option>)}</select></label><label className="mt-4 block text-xs text-muted-foreground">Ocasião ou lembrete<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: reunião às 9h" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm" /></label><button onClick={add} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm text-primary-foreground"><Plus size={15} /> Planejar look</button></section><div className="mt-6 space-y-3">{plans.length === 0 ? <div className="py-12 text-center text-muted-foreground"><CalendarDays className="mx-auto" /><p className="mt-3 text-sm">Nenhum look planejado.</p></div> : plans.map((plan) => { const look = state.looks.find((item) => item.id === plan.lookId); return <article key={plan.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft"><div className="min-w-0 flex-1"><p className="text-xs text-gold">{new Date(`${plan.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}</p><p className="mt-1 text-sm font-medium">{look?.name ?? "Look a decidir"}</p>{plan.note && <p className="text-xs text-muted-foreground">{plan.note}</p>}</div><button onClick={() => actions.removePlan(plan.id)} aria-label="Remover planejamento" className="p-2 text-destructive"><Trash2 size={16} /></button></article>; })}</div></div>;
}