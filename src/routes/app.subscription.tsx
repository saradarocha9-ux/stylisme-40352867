import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CreditCard, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { openCustomerPortal } from "@/lib/stripe.functions";
import { useSubscription, useRefreshSubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/app/subscription")({
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: s.checkout === "success" ? "success" : undefined,
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { status, isPremium, loading, refetch } = useSubscription();
  const search = useSearch({ from: "/app/subscription" });
  const portalFn = useServerFn(openCustomerPortal);
  const refresh = useRefreshSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // After returning from Stripe checkout, poll a few times so the new subscription appears.
  useEffect(() => {
    if (search.checkout !== "success") return;
    let n = 0;
    const iv = setInterval(() => {
      refetch();
      if (++n >= 5) clearInterval(iv);
    }, 1500);
    return () => clearInterval(iv);
  }, [search.checkout, refetch]);

  async function openPortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const { url } = await portalFn();
      if (url) window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível abrir o portal.");
      setPortalLoading(false);
    }
  }

  const nextDate = status.subscriptionEnd
    ? new Date(status.subscriptionEnd).toLocaleDateString("pt-BR")
    : "—";

  return (
    <div className="px-5 pt-8">
      <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="mt-4 font-display text-3xl">Minha assinatura</h1>

      {search.checkout === "success" && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-foreground p-4 text-sm text-primary-foreground">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            Pagamento confirmado. Sua assinatura está sendo ativada — pode levar alguns segundos.
          </div>
        </div>
      )}

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Plano atual</p>
            <p className="font-display text-2xl">Stylisme {isPremium ? "Premium" : "Free"}</p>
          </div>
          <button
            onClick={() => refresh()}
            className="rounded-full border border-border p-2 text-muted-foreground"
            aria-label="Atualizar status"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Verificando com o Stripe…
          </p>
        ) : isPremium ? (
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <Info label="Status" value={status.cancelAtPeriodEnd ? "Cancelamento agendado" : "Ativo"} />
            <Info label="Valor" value="R$ 24,90/mês" />
            <Info label={status.cancelAtPeriodEnd ? "Encerra em" : "Próxima cobrança"} value={nextDate} />
            <Info label="Pagamento" value="Gerenciado no portal" />
          </dl>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">Você está no plano gratuito.</p>
            <Link to="/app/premium" className="mt-5 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.24em] text-primary-foreground">
              Conhecer Premium
            </Link>
          </>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {isPremium && (
        <div className="mt-4 space-y-2">
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-sm shadow-soft disabled:opacity-50"
          >
            {portalLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} strokeWidth={1.5} />}
            Gerenciar assinatura (cartão, cancelamento, faturas)
          </button>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
