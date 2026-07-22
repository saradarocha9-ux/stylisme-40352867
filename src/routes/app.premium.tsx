import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, ArrowLeft, Sparkles, CalendarDays, BarChart3, Cloud, RefreshCw, Zap, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { createCheckout } from "@/lib/stripe.functions";
import { useSubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/app/premium")({
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: s.checkout === "cancelled" ? "cancelled" : undefined,
  }),
  component: PremiumPage,
});

const benefits = [
  { icon: Sparkles, title: "IA ilimitada", desc: "Gere looks sem limites com recomendações refinadas." },
  { icon: CalendarDays, title: "Planejamento semanal e mensal", desc: "Organize sua semana com um calendário elegante." },
  { icon: BarChart3, title: "Estatísticas completas", desc: "Descubra suas peças mais e menos usadas." },
  { icon: Cloud, title: "Backup em nuvem", desc: "Seus dados sempre protegidos." },
  { icon: RefreshCw, title: "Sincronização total", desc: "Continue de qualquer dispositivo, na hora." },
  { icon: Zap, title: "Recursos exclusivos", desc: "Novidades chegam primeiro para você." },
];

const freeFeatures = ["Cadastro de roupas", "Guarda-roupa digital", "Provador virtual", "IA (3 looks/dia)", "Favoritos", "Perfil"];
const premiumFeatures = ["Tudo do Free", "IA ilimitada", "Planejamento inteligente", "Estatísticas", "Recomendações avançadas", "Recursos exclusivos", "Sincronização completa"];

function PremiumPage() {
  const { isPremium, loading } = useSubscription();
  const search = useSearch({ from: "/app/premium" });
  const checkout = useServerFn(createCheckout);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (search.checkout === "cancelled") setShowCancelled(true);
  }, [search.checkout]);

  async function subscribe() {
    setSubmitting(true);
    setError(null);
    try {
      const { url } = await checkout();
      if (url) window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar o checkout.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-premium text-white">
      <div className="mx-auto max-w-md px-6 pb-16 pt-8">
        <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.24em] opacity-70">
          <ArrowLeft size={14} /> Voltar
        </Link>

        {showCancelled && (
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-xs">
            Checkout cancelado. Você continua no plano gratuito.
          </div>
        )}

        <div className="mt-8 text-center animate-fade-in-slow">
          <Crown className="mx-auto text-gold" size={40} strokeWidth={1.5} />
          <p className="mt-3 text-[10px] uppercase tracking-[0.32em] opacity-70">Stylisme</p>
          <h1 className="font-display text-5xl leading-none">Premium</h1>
          <p className="mt-4 text-sm opacity-80">Toda a inteligência do Stylisme, sem limites.</p>

          <div className="mt-8 inline-flex items-baseline gap-1">
            <span className="text-sm opacity-70">R$</span>
            <span className="font-display text-6xl">24,90</span>
            <span className="text-sm opacity-70">/mês</span>
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] opacity-60">Valor fixo · sem surpresas</p>
        </div>

        <div className="mt-10 space-y-3">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-white/5 p-4 backdrop-blur">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-xs opacity-70">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          <Column title="Free" features={freeFeatures} />
          <Column title="Premium" features={premiumFeatures} gold />
        </div>

        {error && <p className="mt-6 text-center text-xs text-red-200">{error}</p>}

        <button
          onClick={subscribe}
          disabled={isPremium || submitting || loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-sm uppercase tracking-[0.28em] text-[oklch(0.16_0.01_60)] shadow-lift disabled:opacity-50"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {isPremium ? "Você já é Premium" : submitting ? "Redirecionando…" : "Assinar Premium"}
        </button>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.24em] opacity-60">Cancele quando quiser · Pagamento seguro via Stripe</p>
      </div>
    </div>
  );
}

function Column({ title, features, gold }: { title: string; features: string[]; gold?: boolean }) {
  return (
    <div className={"rounded-3xl p-5 " + (gold ? "bg-gold/15 border border-gold/30" : "bg-white/5")}>
      <p className={"font-display text-2xl " + (gold ? "text-gold" : "")}>{title}</p>
      <ul className="mt-3 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs opacity-90">
            <Check size={14} className={"mt-0.5 shrink-0 " + (gold ? "text-gold" : "text-white/70")} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
