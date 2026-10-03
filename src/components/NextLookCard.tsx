import { Link } from "@tanstack/react-router";
import { ArrowRight, Shirt } from "lucide-react";

export function NextLookCard() {
  return (
    <Link to="/app/discover" className="press flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
        <Shirt size={18} className="text-gold" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl leading-tight">Seu próximo look</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Descubra combinações para seu estilo, sua rotina e seu orçamento.</p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium">Descobrir meus looks <ArrowRight size={13} /></p>
      </div>
    </Link>
  );
}
