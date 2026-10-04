import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPartnerCheckout, syncPartnerPlan } from "@/lib/partner-plans.functions";
import { PARTNER_PLANS, type PartnerTier } from "@/lib/partner-plans";
import type { Store } from "@/lib/commerce";

export function PartnerPlanCard({ store }: { store: Store }) {
  const checkout = useServerFn(createPartnerCheckout);
  const sync = useServerFn(syncPartnerPlan);
  const [plan, setPlan] = useState<{ tier: string | null; until: string | null }>({ tier: store.partner_tier, until: store.partner_until });
  const [busy, setBusy] = useState<PartnerTier | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    if (store.status !== "verified") return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("partner_session") ?? undefined;
    void sync({ data: { storeId: store.id, sessionId } }).then((r) => {
      setPlan(r);
      if (sessionId && r.until) toast.success("Pagamento confirmado. Seus anúncios aprovados já podem ir ao ar.");
    }).catch(() => {});
    if (params.get("partner") === "cancelled") toast("Pagamento cancelado.");
  }, [store.id, store.status]);

  if (store.status !== "verified") return null;
  const active = plan.until && new Date(plan.until) > new Date();

  if (active) {
    const info = PARTNER_PLANS[plan.tier as PartnerTier];
    return (
      <section className="mt-6 rounded-2xl border border-gold/40 bg-card p-4 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Plano ativo</p>
        <p className="mt-1 font-display text-2xl">{info?.name ?? "Parceiro"}</p>
        <p className="text-xs text-muted-foreground">{info?.reach} · válido até {new Date(plan.until!).toLocaleDateString("pt-BR")}</p>
      </section>
    );
  }

  async function buy(tier: PartnerTier) {
    setBusy(tier);
    try {
      const { url } = await checkout({ data: { storeId: store.id, tier, billing } });
      if (url) window.location.href = url;
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível abrir o pagamento."); setBusy(null); }
  }

  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">Escolha seu plano de parceiro</h2>
      <p className="mt-1 text-xs text-muted-foreground">Você pode criar campanhas e enviá-las para análise. Depois de aprovadas, elas só aparecem no Stylisme com um plano pago.</p>
      <div className="mt-3 inline-flex rounded-full border border-border p-1 text-xs">
        {(["monthly", "yearly"] as const).map((b) => (
          <button key={b} onClick={() => setBilling(b)} className={"rounded-full px-4 py-1.5 " + (billing === b ? "bg-foreground text-primary-foreground" : "text-muted-foreground")}>
            {b === "monthly" ? "Mensal" : "Anual · economize"}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {(Object.keys(PARTNER_PLANS) as PartnerTier[]).map((t) => {
          const p = PARTNER_PLANS[t];
          return (
            <div key={t} className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="font-display text-xl">{p.name}</p>
              <p className="mt-1 text-lg">{billing === "monthly" ? p.monthly : p.year}</p>
              <p className="text-[11px] text-muted-foreground">{billing === "monthly" ? "cobrado todo mês · cancele quando quiser" : p.month}</p>
              <p className="mt-2 text-xs">{p.reach}</p>
              <Button className="mt-3 w-full" disabled={busy !== null} onClick={() => void buy(t)}>{busy === t ? "Abrindo…" : "Assinar"}</Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
