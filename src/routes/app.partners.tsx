import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, ExternalLink, Search, X, Loader2 } from "lucide-react";
import { listPartnerStores, safeExternalUrl, storeAssetUrl, type Store } from "@/lib/commerce";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/partners")({ head:()=>({meta:[{title:"Lojas parceiras — Stylisme"},{name:"description",content:"Explore voluntariamente lojas parceiras identificadas do Stylisme."},{property:"og:title",content:"Lojas parceiras — Stylisme"},{property:"og:description",content:"Catálogo identificado de parceiros comerciais do Stylisme."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}), component:Partners });
function Partners() {
  const [stores, setStores] = useState<Store[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logos, setLogos] = useState<Record<string, string>>({});
  useEffect(() => { void Promise.all(stores.map(async (s) => [s.id, await storeAssetUrl(s.logo_path)] as const)).then((p) => setLogos(Object.fromEntries(p.filter((x) => x[1])) as Record<string, string>)); }, [stores]);
  useEffect(() => {
    void listPartnerStores().then(setStores).catch(() => setError("Não consegui carregar as lojas.")).finally(() => setLoading(false));
  }, []);
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = stores.filter((s) => normalize(`${s.name} ${s.slug} ${s.description}`).includes(normalize(query.trim())));
  return <div className="px-5 pt-8">
    <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft size={14} /> Perfil</Link>
    <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-gold">Relação comercial</p>
    <h1 className="font-display text-3xl">Lojas parceiras</h1>
    <div role="search" className="mt-5 flex min-h-12 items-center gap-3 rounded-lg border border-input bg-card px-3">
      <Search size={18} className="shrink-0 text-muted-foreground" />
      <input type="search" aria-label="Pesquisar lojas" placeholder="Pesquisar lojas" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={80} className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
      {query && <Button variant="ghost" size="icon" aria-label="Limpar pesquisa" onClick={() => setQuery("")}><X /></Button>}
    </div>
    <div className="mt-6 space-y-3" aria-live="polite">
      {loading ? <Loader2 className="animate-spin text-muted-foreground" aria-label="Carregando lojas" /> : error ? <p className="text-sm text-destructive">{error}</p> : filtered.length ? filtered.map((s) => <article key={s.id} className="rounded-lg bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">{logos[s.id] ? <img src={logos[s.id]} alt={s.name} className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted"><Building2 /></div>}<div className="min-w-0"><h2 className="break-words font-display text-xl">{s.name}</h2><p className="text-xs text-muted-foreground">Parceiro identificado</p></div></div>
        <p className="mt-3 text-sm text-muted-foreground">{s.description}</p>
        <div className="mt-3 flex gap-3">{safeExternalUrl(s.website_url) && <a href={safeExternalUrl(s.website_url) ?? undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs underline">Visitar site <ExternalLink size={12} /></a>}<Link to="/loja/$slug" params={{ slug: s.slug }} className="text-xs underline">Ver produtos</Link></div>
      </article>) : <p className="text-sm text-muted-foreground">{query ? "Nenhuma loja encontrada." : "Nenhuma loja verificada disponível agora."}</p>}
    </div>
  </div>;
}
