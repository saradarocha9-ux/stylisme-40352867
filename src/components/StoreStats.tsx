import { useEffect, useState } from "react";
import { listCampaignEventsDetailed, listStoreEvents, type Campaign, type Product, type Store } from "@/lib/commerce";

type SE = { kind: string; product_id: string | null; session_key: string; user_id: string | null; created_at: string };
type CE = { campaign_id: string; kind: string; session_key: string; placement: string; created_at: string };

export function StoreStats({ store, products, campaigns }: { store: Store; products: Product[]; campaigns: Campaign[] }) {
  const [days, setDays] = useState(7);
  const [se, setSe] = useState<SE[] | null>(null);
  const [ce, setCe] = useState<CE[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setSe(null);
    void Promise.all([listStoreEvents(store.id, days), listCampaignEventsDetailed(campaigns.map((c) => c.id), days)])
      .then(([a, b]) => { setSe(a as SE[]); setCe(b as CE[]); })
      .catch((e) => setError(e.message));
  }, [store.id, days, campaigns]);

  if (store.status !== "verified") {
    return <p className="mt-6 rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">As estatísticas começam quando a loja for aprovada e a página pública entrar no ar. Até lá, ninguém consegue visitá-la.</p>;
  }
  if (error) return <p className="mt-6 text-sm text-destructive">{error}</p>;
  if (!se) return <p className="mt-6 text-sm text-muted-foreground">Carregando estatísticas…</p>;

  const count = (k: string) => se.filter((e) => e.kind === k).length;
  const visitors = new Set(se.filter((e) => e.kind === "store_view").map((e) => e.session_key)).size;
  const signedIn = new Set(se.filter((e) => e.user_id).map((e) => e.user_id)).size;
  const impressions = ce.filter((e) => e.kind === "impression").length;
  const adClicks = ce.filter((e) => e.kind === "click").length;
  const ctr = impressions ? ((adClicks / impressions) * 100).toFixed(1) + "%" : "—";

  const dayKeys = Array.from({ length: days }, (_, i) => new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10));
  const perDay = dayKeys.map((d) => ({ d, v: se.filter((e) => e.kind === "store_view" && e.created_at.startsWith(d)).length + se.filter((e) => e.kind === "product_view" && e.created_at.startsWith(d)).length }));
  const max = Math.max(1, ...perDay.map((x) => x.v));

  const productRows = products.map((p) => ({
    name: p.name,
    views: se.filter((e) => e.kind === "product_view" && e.product_id === p.id).length,
    clicks: se.filter((e) => e.kind === "product_click" && e.product_id === p.id).length,
  })).filter((r) => r.views || r.clicks).sort((a, b) => b.views - a.views);

  const campaignRows = campaigns.map((c) => {
    const imp = ce.filter((e) => e.campaign_id === c.id && e.kind === "impression").length;
    const clk = ce.filter((e) => e.campaign_id === c.id && e.kind === "click").length;
    return { name: c.name, status: c.status, imp, clk, people: new Set(ce.filter((e) => e.campaign_id === c.id).map((e) => e.session_key)).size };
  });

  return (
    <section className="mt-6">
      <div className="flex gap-2">
        {[7, 30].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={"rounded-full px-4 py-1.5 text-xs " + (days === d ? "bg-foreground text-background" : "bg-card text-muted-foreground")}>Últimos {d} dias</button>
        ))}
      </div>

      <h3 className="mt-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Página da loja</h3>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <Metric label="Visitas" value={count("store_view")} />
        <Metric label="Visitantes" value={visitors} />
        <Metric label="Com conta" value={signedIn} />
        <Metric label="Produtos vistos" value={count("product_view")} />
        <Metric label="Cliques em produto" value={count("product_click")} />
        <Metric label="Cliques no site" value={count("website_click")} />
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-[10px] uppercase text-muted-foreground">Visualizações por dia</p>
        <div className="mt-3 flex h-24 items-end gap-1">
          {perDay.map((x) => <div key={x.d} title={`${x.d}: ${x.v}`} className="flex-1 rounded-t bg-gold/70" style={{ height: `${(x.v / max) * 100}%`, minHeight: x.v ? 4 : 1 }} />)}
        </div>
      </div>

      <h3 className="mt-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Anúncios no Inspire-se</h3>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <Metric label="Exibições" value={impressions} />
        <Metric label="Cliques" value={adClicks} />
        <Metric label="Taxa de clique" value={ctr} />
      </div>
      {campaignRows.length > 0 && (
        <div className="mt-3 rounded-2xl bg-card px-4 shadow-soft">
          {campaignRows.map((r) => (
            <div key={r.name} className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0">
              <div><p>{r.name}</p><p className="text-xs text-muted-foreground">{r.status}</p></div>
              <p className="text-right text-xs text-muted-foreground">{r.imp} exibições · {r.clk} cliques<br />{r.people} pessoas alcançadas</p>
            </div>
          ))}
        </div>
      )}

      <h3 className="mt-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Produtos mais vistos</h3>
      <div className="mt-2 rounded-2xl bg-card px-4 shadow-soft">
        {productRows.length ? productRows.map((r) => (
          <div key={r.name} className="flex justify-between border-b border-border py-3 text-sm last:border-0"><span>{r.name}</span><span className="text-xs text-muted-foreground">{r.views} vistas · {r.clicks} cliques</span></div>
        )) : <p className="py-4 text-sm text-muted-foreground">Nenhuma visualização de produto no período.</p>}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Somente o que foi registrado de verdade. Visitas repetidas da mesma pessoa contam uma vez por hora. Cliques não representam vendas.</p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl bg-card p-3 shadow-soft"><p className="font-display text-2xl">{value}</p><p className="text-[9px] uppercase text-muted-foreground">{label}</p></div>;
}
