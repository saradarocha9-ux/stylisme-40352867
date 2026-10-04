import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bookmark, Check, Loader2, RefreshCw, PiggyBank, ThumbsDown, X, Shirt, ShoppingBag, Compass } from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { useSubscription } from "@/hooks/use-subscription";
import { FREE_AI_DAILY, aiUsedToday, bumpAi } from "@/lib/plan-limits";
import { discoverLooks, type Budget, type DiscoverLook, type DiscoverMode, type DiscoverPrefs } from "@/lib/discover-ai.functions";
import preferenceBoard from "@/assets/style-preference-board.jpg";

export const Route = createFileRoute("/app/discover")({
  head: () => ({
    meta: [
      { title: "Seu próximo look — Stylisme" },
      { name: "description", content: "Descubra combinações para seu estilo, sua rotina e seu orçamento, com peças do seu armário." },
      { property: "og:title", content: "Seu próximo look — Stylisme" },
      { property: "og:description", content: "Descubra combinações para seu estilo, sua rotina e seu orçamento, com peças do seu armário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiscoverPage,
});

const PREFS_KEY = "stylisme:discover:prefs";
const FEEDBACK_KEY = "stylisme:discover:feedback";
const SAVED_KEY = "stylisme:discover:saved";

const MODES: { id: DiscoverMode; title: string; text: string; icon: React.ElementType }[] = [
  { id: "own", title: "Usar o que tenho", text: "Combinações com peças do seu armário.", icon: Shirt },
  { id: "complete", title: "Completar meu look", text: "Aproveita suas roupas e sugere uma peça adicional.", icon: ShoppingBag },
  { id: "explore", title: "Explorar novos estilos", text: "Inspirações que podem incluir peças que você ainda não tem.", icon: Compass },
];

const VISUAL_LOOKS = [
  { id: "Jeans, camiseta branca e tênis", hint: "Básico descontraído", position: "0% 0%" },
  { id: "Calça de alfaiataria, camisa e mocassim", hint: "Arrumado clássico", position: "50% 0%" },
  { id: "Vestido fluido e sandália", hint: "Leve e romântico", position: "100% 0%" },
  { id: "Moletom amplo, cargo e tênis robusto", hint: "Streetwear", position: "0% 100%" },
  { id: "Tricô neutro, saia midi e bota", hint: "Minimalista", position: "50% 100%" },
  { id: "Legging, top e jaqueta corta-vento", hint: "Esportivo", position: "100% 100%" },
];
const OCCASIONS = ["Trabalho", "Faculdade", "Passeio", "Jantar", "Festa", "Viagem", "Academia", "Praia"];
const BUDGETS: { id: Budget; label: string }[] = [
  { id: "none", label: "Não quero comprar agora" },
  { id: "low", label: "Econômico" },
  { id: "mid", label: "Intermediário" },
  { id: "high", label: "Posso investir" },
];
const COMFORT = ["Conforto acima de tudo", "Prefiro tênis", "Uso salto", "Peças mais soltas", "Peças ajustadas"];
const STYLES = ["Elegante", "Minimalista", "Streetwear", "Casual", "Romântico", "Vintage", "Esportivo", "Não sei dizer"];

const EMPTY: DiscoverPrefs = { styles: [], liked: [], disliked: [], occasion: "", budget: "none", comfort: [], avoidColors: "", trends: "classic" };

interface Saved extends DiscoverLook { id: string; savedAt: number }

function read<T>(k: string, fb: T): T {
  try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return fb; }
}

function DiscoverPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const run = useServerFn(discoverLooks);
  const [step, setStep] = useState<"mode" | "prefs" | "results">("mode");
  const [mode, setMode] = useState<DiscoverMode>("own");
  const [prefs, setPrefs] = useState<DiscoverPrefs>(EMPTY);
  const [looks, setLooks] = useState<DiscoverLook[]>([]);
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const [error, setError] = useState("");
  const [used, setUsed] = useState(0);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [hasPrefs, setHasPrefs] = useState(false);

  useEffect(() => {
    const p = read<DiscoverPrefs | null>(PREFS_KEY, null);
    if (p) { setPrefs({ ...EMPTY, ...p }); setHasPrefs(true); }
    setSaved(read<Saved[]>(SAVED_KEY, []));
    setUsed(aiUsedToday());
  }, []);

  const remaining = isPremium ? Infinity : Math.max(0, FREE_AI_DAILY - used);
  const palette = state.profile.colorAnalysis?.palette.map((c) => c.name);
  const byId = new Map(state.garments.map((g) => [g.id, g]));

  function toggle(field: "styles" | "comfort", v: string) {
    setPrefs((p) => ({ ...p, [field]: p[field].includes(v) ? p[field].filter((x) => x !== v) : [...p[field], v] }));
  }
  function rate(id: string, yes: boolean) {
    setPrefs((p) => ({
      ...p,
      liked: yes ? [...new Set([...p.liked, id])] : p.liked.filter((x) => x !== id),
      disliked: !yes ? [...new Set([...p.disliked, id])] : p.disliked.filter((x) => x !== id),
    }));
  }

  async function call(tweak?: { kind: "swap" | "cheaper"; index: number }) {
    setError("");
    if (!isPremium && remaining <= 0) { setError(`Você usou as ${FREE_AI_DAILY} gerações de hoje no plano Free.`); return; }
    if (mode === "own" && state.garments.length < 2) { setError("Cadastre pelo menos 2 peças para usar o que você tem."); return; }
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setBusy(tweak ? tweak.index : "all");
    try {
      const res = await run({
        data: {
          mode,
          prefs,
          palette,
          feedback: read<string[]>(FEEDBACK_KEY, []),
          garments: state.garments.map((g) => ({ id: g.id, name: g.name, category: g.category, color: g.color, material: g.material, pattern: g.pattern, occasions: g.occasions, seasons: g.seasons })),
          tweak: tweak ? { kind: tweak.kind, base: looks[tweak.index] } : undefined,
        },
      });
      if (tweak) setLooks((ls) => ls.map((l, i) => (i === tweak.index ? res[0] : l)));
      else { setLooks(res); setStep("results"); }
      if (!isPremium) setUsed(bumpAi());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não consegui montar os looks agora.");
    } finally {
      setBusy(null);
    }
  }

  function save(l: DiscoverLook) {
    const next = [{ ...l, id: crypto.randomUUID(), savedAt: Date.now() }, ...saved];
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  }
  function removeSaved(id: string) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  }
  function reject(i: number) {
    const l = looks[i];
    const fb = [...read<string[]>(FEEDBACK_KEY, []), `${l.title}: ${l.why}`].slice(-10);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
    setLooks((ls) => ls.filter((_, k) => k !== i));
  }
  function tryOn(l: DiscoverLook) {
    actions.tryOnClear();
    l.ownedIds.forEach((id) => actions.tryOnAdd(id));
    navigate({ to: "/app/looks" });
  }

  const costNote = isPremium ? "Uso sem limite no Premium." : `Cada busca ou ajuste consome 1 geração de IA (restam ${remaining} hoje).`;

  return (
    <div className="px-5 pt-8 pb-10">
      <button onClick={() => (step === "mode" ? navigate({ to: "/app" }) : setStep(step === "results" ? "prefs" : "mode"))} className="press flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft size={14} /> Voltar
      </button>
      <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Etapa {step === "mode" ? 1 : step === "prefs" ? 2 : 3} de 3</p>
      <h1 className="font-display text-3xl">Seu próximo look</h1>

      {step === "mode" && (
        <section className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">Como você quer montar hoje? Não precisa de foto de rosto nem de corpo.</p>
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setStep("prefs"); }} className="press flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft">
              <m.icon size={18} className="mt-0.5 text-gold" />
              <span><span className="block text-sm font-medium">{m.title}{m.id === "complete" && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px]">Destaque</span>}</span><span className="text-xs text-muted-foreground">{m.text}</span></span>
            </button>
          ))}
          <SavedList saved={saved} byId={byId} onRemove={removeSaved} />
        </section>
      )}

      {step === "prefs" && (
        <section className="mt-6 space-y-6">
          {hasPrefs && <p className="rounded-2xl bg-muted p-3 text-xs">Usamos suas preferências anteriores{palette ? " e sua cartela de cores" : ""}. Ajuste o que quiser.</p>}

          <Block title="Você usaria?">
            <div className="grid gap-2 sm:grid-cols-2">
              {VISUAL_LOOKS.map((v) => {
                const yes = prefs.liked.includes(v.id), no = prefs.disliked.includes(v.id);
                return (
                   <div key={v.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                     <div role="img" aria-label={v.id} className="aspect-[3/4] bg-cover" style={{ backgroundImage: `url(${preferenceBoard})`, backgroundPosition: v.position, backgroundSize: "300% 200%" }} />
                     <div className="flex items-center justify-between gap-2 p-3"><div><p className="text-sm">{v.id}</p><p className="text-[11px] text-muted-foreground">{v.hint}</p></div>
                     <div className="flex gap-1">
                      <button aria-label="Usaria" onClick={() => rate(v.id, true)} className={pill(yes) + " p-2"}><Check size={13} /></button>
                      <button aria-label="Não usaria" onClick={() => rate(v.id, false)} className={pill(no) + " p-2"}><X size={13} /></button>
                     </div></div>
                  </div>
                );
              })}
            </div>
          </Block>

          <Block title="Estilos que combinam com você (pode escolher vários)">
            <Chips items={STYLES} active={prefs.styles} onToggle={(v) => toggle("styles", v)} />
          </Block>

          <Block title="Ocasião">
            <Chips items={OCCASIONS} active={[prefs.occasion]} onToggle={(v) => setPrefs((p) => ({ ...p, occasion: p.occasion === v ? "" : v }))} />
          </Block>

          <Block title="Orçamento">
            <Chips items={BUDGETS.map((b) => b.label)} active={[BUDGETS.find((b) => b.id === prefs.budget)!.label]} onToggle={(v) => setPrefs((p) => ({ ...p, budget: BUDGETS.find((b) => b.label === v)!.id }))} />
          </Block>

          <Block title="Preferências práticas">
            <Chips items={COMFORT} active={prefs.comfort} onToggle={(v) => toggle("comfort", v)} />
            <input value={prefs.avoidColors} onChange={(e) => setPrefs((p) => ({ ...p, avoidColors: e.target.value }))} placeholder="Cores que você evita (ex.: amarelo, laranja)" className="mt-3 w-full rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none" />
          </Block>

          <Block title="Tendências">
            <Chips items={["Prefiro combinações clássicas", "Quero experimentar novidades"]} active={[prefs.trends === "new" ? "Quero experimentar novidades" : "Prefiro combinações clássicas"]} onToggle={(v) => setPrefs((p) => ({ ...p, trends: v.startsWith("Quero") ? "new" : "classic" }))} />
            {prefs.trends === "new" && <p className="mt-2 text-[11px] text-muted-foreground">As novidades são ideias de estilo; ainda não usamos dados atualizados do que está em alta.</p>}
          </Block>

          {error && <ErrorBox error={error} />}
          <p className="text-[11px] text-muted-foreground">{costNote}</p>
          <button onClick={() => call()} disabled={busy !== null} className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm text-primary-foreground disabled:opacity-60">
            {busy === "all" ? <><Loader2 size={14} className="animate-spin" /> Montando seus looks…</> : "Descobrir meus looks"}
          </button>
        </section>
      )}

      {step === "results" && (
        <section className="mt-6 space-y-4">
          <p className="text-xs text-muted-foreground">{costNote}</p>
          {error && <ErrorBox error={error} />}
          <div className="grid gap-4 lg:grid-cols-3">
            {looks.map((l, i) => (
              <article key={i} className="rounded-3xl bg-card p-4 shadow-soft">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{l.occasion}</p>
                <h2 className="font-display text-xl">{l.title}</h2>
                {l.ownedIds.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {l.ownedIds.slice(0, 6).map((id) => {
                      const g = byId.get(id);
                      return <div key={id} className="aspect-square overflow-hidden rounded-lg bg-muted">{g?.imageUrl && <img src={g.imageUrl} alt={g.name} className="h-full w-full object-contain" />}</div>;
                    })}
                  </div>
                )}
                <p className="mt-3 text-xs"><b>Por que foi sugerido:</b> {l.why}</p>
                <p className="mt-2 text-xs"><b>Você já tem:</b> {l.ownedIds.map((id) => byId.get(id)?.name).filter(Boolean).join(", ") || "nenhuma peça do armário"}</p>
                {l.toAdd.length > 0 && <p className="mt-2 text-xs"><b>Para completar (não está no seu armário):</b> {l.toAdd.join(", ")}</p>}
                {l.alternative && <p className="mt-2 text-xs text-muted-foreground"><b>Alternativa:</b> {l.alternative}</p>}
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <Act onClick={() => save(l)} icon={Bookmark}>Salvar look</Act>
                  <Act onClick={() => call({ kind: "swap", index: i })} icon={busy === i ? Loader2 : RefreshCw} disabled={busy !== null}>Trocar uma peça</Act>
                  <Act onClick={() => call({ kind: "cheaper", index: i })} icon={PiggyBank} disabled={busy !== null}>Mais econômico</Act>
                  <Act onClick={() => reject(i)} icon={ThumbsDown}>Não combina comigo</Act>
                </div>
                {l.ownedIds.length > 0 && <button onClick={() => tryOn(l)} className="mt-2 w-full rounded-full border border-border py-2 text-xs">Visualizar no corpo (opcional)</button>}
              </article>
            ))}
          </div>
          {!looks.length && <p className="text-sm text-muted-foreground">Sem sugestões na tela. Gere novas combinações.</p>}
          <button onClick={() => call()} disabled={busy !== null} className="w-full rounded-full bg-foreground py-3 text-sm text-primary-foreground disabled:opacity-60">Gerar novas sugestões</button>
          <SavedList saved={saved} byId={byId} onRemove={removeSaved} />
        </section>
      )}
    </div>
  );
}

function SavedList({ saved, byId, onRemove }: { saved: Saved[]; byId: Map<string, { name: string }>; onRemove: (id: string) => void }) {
  if (!saved.length) return null;
  return (
    <div className="pt-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Inspirações salvas — separadas do seu armário</p>
      <ul className="mt-2 space-y-2">
        {saved.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-2 rounded-2xl border border-border p-3 text-xs">
            <span><b>{s.title}</b> · {s.ownedIds.map((id) => byId.get(id)?.name).filter(Boolean).join(", ")}{s.toAdd.length ? ` + para comprar: ${s.toAdd.join(", ")}` : ""}</span>
            <button aria-label="Remover inspiração" onClick={() => onRemove(s.id)}><X size={13} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{title}</p>{children}</div>;
}
function Chips({ items, active, onToggle }: { items: string[]; active: string[]; onToggle: (v: string) => void }) {
  return <div className="flex flex-wrap gap-1.5">{items.map((i) => <button key={i} onClick={() => onToggle(i)} className={pill(active.includes(i)) + " px-3 py-1 text-xs"}>{i}</button>)}</div>;
}
function Act({ onClick, icon: Icon, children, disabled }: { onClick: () => void; icon: React.ElementType; children: React.ReactNode; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="flex items-center justify-center gap-1 rounded-full border border-border px-2 py-2 text-[11px] disabled:opacity-50"><Icon size={12} className={Icon === Loader2 ? "animate-spin" : ""} />{children}</button>;
}
function ErrorBox({ error }: { error: string }) {
  return <p className="rounded-2xl border border-border p-3 text-xs">{error} {error.includes("Free") && <Link to="/app/premium" className="underline">Ver Premium</Link>}</p>;
}
function pill(active: boolean) {
  return "rounded-full border transition " + (active ? "border-foreground bg-foreground text-primary-foreground" : "border-border text-muted-foreground");
}
