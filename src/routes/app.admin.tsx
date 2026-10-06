import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, ShieldAlert, X, Trash2, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublishLookSheet } from "@/components/PublishLookSheet";
import { getAdminOverview, moderateEntity, getCreatorStats, listAllPosts, adminDeletePost, listAdminUsers, listAdminStores, adminDeleteStore } from "@/lib/admin.functions";
import { useSession } from "@/hooks/use-session";
import { isOfficialUser } from "@/lib/official";

export const Route = createFileRoute("/app/admin")({
  head: () => ({
    meta: [
      { title: "Painel do criador — Stylisme" },
      { name: "description", content: "Painel de administração do Stylisme: análises, lojas, campanhas, posts e usuários." },
      { property: "og:title", content: "Painel do criador — Stylisme" },
      { property: "og:description", content: "Área restrita de administração do Stylisme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Tab = "geral" | "posts" | "lojas" | "usuarios" | "publicar";

function Admin() {
  const { session } = useSession();
  const official = isOfficialUser(session?.user.id, session?.user.email);
  const [tab, setTab] = useState<Tab>("geral");
  const tabs: [Tab, string][] = [["geral", "Visão geral"], ["posts", "Posts"], ["lojas", "Lojas"], ["usuarios", "Usuários"], ["publicar", "Publicar"]];
  return (
    <div className="px-5 pt-8 pb-12">
      {!official && <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs"><ArrowLeft size={14} /> Perfil</Link>}
      <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-gold">Stylisme</p>
      <h1 className="font-display text-3xl">Painel do criador</h1>
      <div className="mt-5 flex gap-2 overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={"whitespace-nowrap rounded-full px-4 py-2 text-xs " + (tab === k ? "bg-foreground text-background" : "bg-card text-muted-foreground")}>{l}</button>
        ))}
      </div>
      {tab === "geral" && <Overview />}
      {tab === "posts" && <Posts />}
      {tab === "lojas" && <Stores />}
      {tab === "usuarios" && <Users />}
      {tab === "publicar" && <Publish />}
    </div>
  );
}

function Overview() {
  const get = useServerFn(getAdminOverview), stats = useServerFn(getCreatorStats), act = useServerFn(moderateEntity);
  const [data, setData] = useState<any>(), [s, setS] = useState<any>(), [error, setError] = useState("");
  const load = () => Promise.all([get().then(setData), stats().then(setS)]).catch((e) => setError(e.message));
  useEffect(() => { void load(); }, []);
  async function decide(kind: "store" | "campaign" | "report", id: string, decision: string, postId?: string) {
    const reason = decision === "approve" ? "" : prompt("Registre o motivo da decisão") ?? "";
    try { await act({ data: { kind, id, decision, reason, postId } }); toast.success("Decisão registrada."); await load(); }
    catch (e: any) { toast.error(e.message); }
  }
  if (error) return <div className="pt-12 text-center"><ShieldAlert className="mx-auto" /><p className="mt-3">{error}</p></div>;
  if (!data || !s) return <div className="p-8 text-center">Carregando…</div>;
  const impressions = data.events.filter((e: any) => e.kind === "impression").length;
  const clicks = data.events.filter((e: any) => e.kind === "click").length;
  return (
    <>
      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card l="Contas" v={s.users} /><Card l="Premium" v={s.premium} /><Card l="Novas (7 dias)" v={s.newUsers} /><Card l="Usos de IA hoje" v={s.aiToday} />
        <Card l="Looks publicados" v={s.posts} /><Card l="Looks (7 dias)" v={s.postsWeek} /><Card l="Lojas verificadas" v={`${s.verifiedStores}/${s.stores}`} /><Card l="Cliques / impressões" v={`${clicks}/${impressions}`} />
      </section>
      <p className="mt-2 text-[11px] text-muted-foreground">Números reais do banco, sem estimativas.</p>
      <AdminSection title="Lojas aguardando verificação">{data.stores.length ? data.stores.map((x: any) => <Item key={x.id} title={x.name} sub={x.status}><Actions yes={() => decide("store", x.id, "approve")} no={() => decide("store", x.id, "reject")} /></Item>) : null}</AdminSection>
      <AdminSection title="Campanhas em análise">{data.campaigns.length ? data.campaigns.map((c: any) => <Item key={c.id} title={c.name} sub={`${c.stores?.name ?? "Loja"} · ${c.status}`}><Actions yes={() => decide("campaign", c.id, "approve")} no={() => decide("campaign", c.id, "reject")} /></Item>) : null}</AdminSection>
      <AdminSection title="Denúncias">{data.reports.length ? data.reports.map((r: any) => <Item key={r.id} title={r.look_posts?.title ?? "Publicação"} sub={r.reason}><Button size="sm" variant="destructive" onClick={() => void decide("report", r.id, "suspend", r.post_id)}>Suspender e resolver</Button><Button size="sm" variant="outline" onClick={() => void decide("report", r.id, "dismiss", r.post_id)}>Arquivar</Button></Item>) : null}</AdminSection>
    </>
  );
}

function Posts() {
  const list = useServerFn(listAllPosts), del = useServerFn(adminDeletePost);
  const [posts, setPosts] = useState<any[] | null>(null);
  const load = () => list().then(setPosts).catch((e) => toast.error(e.message));
  useEffect(() => { void load(); }, []);
  async function remove(p: any) {
    if (!confirm(`Excluir "${p.title}" de ${p.author_name}? Isso não pode ser desfeito.`)) return;
    try { await del({ data: { id: p.id } }); toast.success("Post excluído."); setPosts((xs) => xs?.filter((x) => x.id !== p.id) ?? null); }
    catch (e: any) { toast.error(e.message); }
  }
  if (!posts) return <div className="p-8 text-center">Carregando…</div>;
  if (!posts.length) return <p className="mt-6 text-sm text-muted-foreground">Nenhum post publicado.</p>;
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {posts.map((p) => (
        <div key={p.id} className="overflow-hidden rounded-2xl bg-card shadow-soft">
          {p.image_url ? <img src={p.image_url} alt={p.title} className="aspect-[4/5] w-full object-cover" loading="lazy" /> : <div className="aspect-[4/5] bg-muted" />}
          <div className="p-3">
            <Link to="/app/look/$postId" params={{ postId: p.id }} className="line-clamp-1 text-sm font-medium">{p.title}</Link>
            <p className="line-clamp-1 text-[11px] text-muted-foreground">{p.author_name} · {p.likes_count} curtidas{p.suspended_at ? " · suspenso" : ""}</p>
            <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => void remove(p)}><Trash2 /> Excluir</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stores() {
  const list = useServerFn(listAdminStores), del = useServerFn(adminDeleteStore);
  const [stores, setStores] = useState<any[] | null>(null);
  const load = () => list().then(setStores).catch((e) => toast.error(e.message));
  useEffect(() => { void load(); }, []);
  async function remove(s: any) {
    if (!confirm(`Excluir a loja "${s.name}"? Produtos, campanhas e estatísticas dela também serão apagados. Isso não pode ser desfeito.`)) return;
    try { await del({ data: { id: s.id } }); toast.success("Loja excluída."); setStores((xs) => xs?.filter((x) => x.id !== s.id) ?? null); }
    catch (e: any) { toast.error(e.message); }
  }
  if (!stores) return <div className="p-8 text-center">Carregando…</div>;
  if (!stores.length) return <p className="mt-6 text-sm text-muted-foreground">Nenhuma loja cadastrada.</p>;
  const statusLabel: Record<string, string> = { pending: "aguardando", verified: "verificada", rejected: "recusada", suspended: "suspensa" };
  return (
    <div className="mt-6 rounded-2xl bg-card px-4 shadow-soft">
      {stores.map((s) => (
        <div key={s.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
          {s.logo_url ? <img src={s.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-muted" />}
          <div className="min-w-0 flex-1">
            <Link to="/loja/$slug" params={{ slug: s.slug }} className="block truncate text-sm font-medium">{s.name}</Link>
            <p className="text-[11px] text-muted-foreground">{statusLabel[s.status] ?? s.status}</p>
          </div>
          <Button size="sm" variant="destructive" onClick={() => void remove(s)}><Trash2 /> Excluir</Button>
        </div>
      ))}
    </div>
  );
}

function Users() {
  const list = useServerFn(listAdminUsers);
  const [q, setQ] = useState(""), [users, setUsers] = useState<any[] | null>(null);
  const load = (query = q) => list({ data: { q: query } }).then(setUsers).catch((e) => toast.error(e.message));
  useEffect(() => { void load(""); }, []);
  return (
    <div className="mt-6">
      <form onSubmit={(e) => { e.preventDefault(); void load(); }} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail ou @usuário" />
        <Button type="submit" size="icon" aria-label="Buscar"><Search /></Button>
      </form>
      {!users ? <div className="p-8 text-center">Carregando…</div> : (
        <div className="mt-4 rounded-2xl bg-card px-4 shadow-soft">
          {users.length ? users.map((u) => (
            <Link key={u.id} to="/app/u/$userId" params={{ userId: u.id }} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{u.name || "Sem nome"}{u.username ? ` · @${u.username}` : ""}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div>
              <span className={"ml-3 rounded-full px-2 py-0.5 text-[10px] uppercase " + (u.plan === "premium" ? "bg-gold/20 text-foreground" : "bg-muted text-muted-foreground")}>{u.plan}</span>
            </Link>
          )) : <p className="py-4 text-sm text-muted-foreground">Nenhuma conta encontrada.</p>}
        </div>
      )}
    </div>
  );
}

function Publish() {
  const [img, setImg] = useState<string | null>(null);
  function pick(f?: File) { if (!f) return; const r = new FileReader(); r.onload = () => setImg(String(r.result)); r.readAsDataURL(f); }
  return (
    <div className="mt-6">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Upload />
        <span className="text-sm">Escolher foto do editorial</span>
        <span className="text-xs text-muted-foreground">Publica no Inspire-se pela conta em que você está.</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {img && <PublishLookSheet imageDataUrl={img} garments={[]} authorName="Stylisme" onClose={() => setImg(null)} />}
    </div>
  );
}

function Card({ l, v }: { l: string; v: number | string }) {
  return <div className="rounded-2xl bg-card p-4 shadow-soft"><p className="font-display text-3xl">{v}</p><p className="text-[10px] uppercase text-muted-foreground">{l}</p></div>;
}
function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-7"><h2 className="font-display text-2xl">{title}</h2><div className="mt-2 rounded-2xl bg-card px-4 shadow-soft">{children || <p className="py-4 text-sm text-muted-foreground">Nenhum item.</p>}</div></section>;
}
function Item({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return <div className="border-b border-border py-4 last:border-0"><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{sub}</p><div className="mt-2 flex gap-2">{children}</div></div>;
}
function Actions({ yes, no }: { yes: () => void; no: () => void }) {
  return <><Button size="sm" onClick={yes}><Check /> Aprovar</Button><Button size="sm" variant="destructive" onClick={no}><X /> Reprovar</Button></>;
}
