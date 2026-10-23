import { useEffect, useState } from "react";
import { getStoreSummary, type StoreSummary, type Campaign, type Product, type Store } from "@/lib/commerce";

export function StoreStats({ store, products, campaigns }: { store: Store; products: Product[]; campaigns: Campaign[] }) {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setSummary(null);
    setError("");
    if (store.status === "verified") void getStoreSummary(store.id, days)
      .then((data) => { if (alive) setSummary(data); })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [store.id, store.status, days]);

  if (store.status !== "verified") {
    return <p className="mt-6 rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">As estatísticas começam quando a loja for aprovada e a página pública entrar no ar. Até lá, ninguém consegue visitá-la.</p>;
  }
  if (error) return <p className="mt-6 text-sm text-destructive">{error}</p>;
  if (!summary) return <p className="mt-6 text-sm text-muted-foreground">Carregando estatísticas…</p>;

  const count = (k: string) => summary.counts[k] ?? 0;
  const { visitors, signedIn, impressions, adClicks } = summary;
  const ctr = impressions ? ((adClicks / impressions) * 100).toFixed(1) + "%" : "—";

  const dayKeys = Array.from({ length: days }, (_, i) => new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10));
  const perDay = dayKeys.map((d) => ({ d, v: summary.daily.find((day) => day.d === d)?.v ?? 0 }));
  const max = Math.max(1, ...perDay.map((x) => x.v));

  const productRows = products.map((p) => ({
    name: p.name,
    views: summary.products.find((row) => row.id === p.id)?.views ?? 0,
    clicks: summary.products.find((row) => row.id === p.id)?.clicks ?? 0,
  })).filter((r) => r.views || r.clicks).sort((a, b) => b.views - a.views);

  const campaignRows = campaigns.map((c) => {
    const row = summary.campaigns.find((row) => row.id === c.id);
    return { name: c.name, status: c.status, imp: row?.imp ?? 0, clk: row?.clk ?? 0, people: row?.people ?? 0 };
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
