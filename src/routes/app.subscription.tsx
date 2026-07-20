import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CreditCard } from "lucide-react";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/app/subscription")({
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { state } = useStore();
  const isPremium = state.profile.plan === "premium";
  const next = new Date(Date.now() + 30 * 86400000).toLocaleDateString("pt-BR");

  return (
    <div className="px-5 pt-8">
      <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="mt-4 font-display text-3xl">Minha assinatura</h1>

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Plano atual</p>
        <p className="font-display text-2xl">Stylisme {isPremium ? "Premium" : "Free"}</p>

        {isPremium ? (
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <Info label="Status" value="Ativo" />
            <Info label="Valor" value="R$ 24,90/mês" />
            <Info label="Próxima cobrança" value={next} />
            <Info label="Pagamento" value="•••• 4242" />
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

      {isPremium && (
        <div className="mt-4 space-y-2">
          <button className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-sm shadow-soft">
            <CreditCard size={18} strokeWidth={1.5} /> Atualizar cartão
          </button>
          <button
            onClick={() => { if (confirm("Cancelar renovação automática?")) actions.updateProfile({ plan: "free" }); }}
            className="w-full rounded-2xl bg-card p-4 text-left text-sm text-destructive shadow-soft"
          >
            Cancelar renovação automática
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
