import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, User as UserIcon, X, RotateCcw, Sparkles, Users, Check } from "lucide-react";
import { useStore, actions, type Garment } from "@/lib/store";
import { generateVirtualTryOn } from "@/lib/virtual-tryon.functions";
import { useSubscription } from "@/hooks/use-subscription";
import { FREE_TRYON_DAILY, bumpTryOn, tryOnUsedToday } from "@/lib/plan-limits";
import { AddGarmentSheet } from "@/components/AddGarmentSheet";
import { track } from "@/lib/track";
import { resizeDataUrl } from "@/lib/image-resize";
import { PublishLookSheet } from "@/components/PublishLookSheet";

import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/looks")({
  head: () => ({
    meta: [
      { title: "Provador virtual | Stylisme" },
      { name: "description", content: "Experimente suas roupas com caimento inteligente no corpo." },
      { property: "og:title", content: "Provador virtual | Stylisme" },
      { property: "og:description", content: "Experimente suas roupas com caimento inteligente no corpo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/app/looks" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/app/looks" }],
  }),
  component: TryOnPage,
});

function TryOnPage() {
  const { state } = useStore();
  const createTryOn = useServerFn(generateVirtualTryOn);
  const { isPremium } = useSubscription();
  const [usedTryOn, setUsedTryOn] = useState(0);
  const [addingGarment, setAddingGarment] = useState(false);
  useEffect(() => { setUsedTryOn(tryOnUsedToday()); }, []);
  const tryOnLeft = isPremium ? Infinity : Math.max(0, FREE_TRYON_DAILY - usedTryOn);
  const [picker, setPicker] = useState(false);
  const [bodyBusy, setBodyBusy] = useState(false);
  const [tryOnBusy, setTryOnBusy] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const bodyRef = useRef<HTMLInputElement>(null);
  const generationInFlight = useRef(false);

  const body = state.profile.bodyPhotoUrl;
  const items = useMemo(() => [...state.tryOn].sort((a, b) => a.z - b.z), [state.tryOn]);

  async function onBodyFile(f: File) {
    setBodyBusy(true);
    try {
      // A foto da pessoa precisa manter o cenário original. Somente as peças
      // cadastradas passam pela remoção de fundo.
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Foto inválida"));
        reader.onerror = () => reject(new Error("Não foi possível ler a foto"));
        reader.readAsDataURL(f);
      });
      actions.tryOnClear();
      setGeneratedUrl(null);
      actions.updateProfile({ bodyPhotoUrl: url });
    } catch (e) {
      console.error(e);
      setTryOnError(e instanceof Error ? e.message : "Não foi possível preparar a foto.");
    } finally {
      setBodyBusy(false);
    }
  }

  async function renderGarments(garments: Garment[], baseUrl?: string) {
    const base = baseUrl ?? body;
    if (generationInFlight.current) return;
    const valid = garments.filter((garment) => !!garment.imageUrl);
    if (!base || valid.length === 0) {
      setGeneratedUrl(null);
      return;
    }
    if (!isPremium && tryOnUsedToday() >= FREE_TRYON_DAILY) {
      setTryOnError(`Você usou as ${FREE_TRYON_DAILY} provas de hoje no plano Free. Volte amanhã ou assine o Premium para provar sem limite.`);
      return;
    }
    generationInFlight.current = true;
    setTryOnBusy(true);
    setTryOnError(null);
    try {
      // A foto do corpo entra maior e as peças entram pequenas: quando a peça
      // chega maior que a pessoa, o modelo devolve a roupa gigante ao fundo.
      // Tamanhos enxutos para o upload e a geração ficarem abaixo de 10s.
      const baseImage = await resizeDataUrl(base, 896);
      const payloadGarments = await Promise.all(
        valid.map(async (garment) => ({
          dataUrl: await resizeDataUrl(garment.imageUrl as string, 256),
          name: garment.name,
          category: garment.category,
          material: garment.material,
        })),
      );

      const result = await createTryOn({ data: { bodyDataUrl: baseImage, garments: payloadGarments } });
      setGeneratedUrl(result.imageUrl);
      track("tryon");
      bumpTryOn();
      setUsedTryOn(tryOnUsedToday());
    } catch (error) {
      setTryOnError(error instanceof Error ? error.message : "Não foi possível vestir as peças.");
      throw error;
    } finally {
      generationInFlight.current = false;
      setTryOnBusy(false);
    }
  }


  function toggleGarment(garment: Garment) {
    if (tryOnBusy) return;
    if (state.tryOn.some((item) => item.garmentId === garment.id)) actions.tryOnRemove(garment.id);
    else actions.tryOnAdd(garment.id);
    setGeneratedUrl(null);
    setTryOnError(null);
  }

  function removeGarment(garmentId: string) {
    if (tryOnBusy) return;
    actions.tryOnRemove(garmentId);
    setGeneratedUrl(null);
    setTryOnError(null);
  }

  async function dressSelectedGarments() {
    const garments = items.flatMap((item) => {
      const garment = state.garments.find((candidate) => candidate.id === item.garmentId);
      return garment ? [garment] : [];
    });
    if (garments.some((garment) => !garment.imageUrl)) {
      setTryOnError("Adicione uma foto às peças selecionadas antes de vestir.");
      return;
    }
    try { await renderGarments(garments, body); } catch { /* erro exibido na tela */ }
  }


  return (
    <div className="px-5 pt-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Prove antes de vestir</p>
          <h1 className="font-display text-3xl">Provador</h1>
        </div>
        <div className="flex gap-2">
          {state.tryOn.length > 0 && (
            <button
              disabled={tryOnBusy}
              onClick={() => {
                if (confirm("Limpar o provador?")) {
                  actions.tryOnClear();
                  setGeneratedUrl(null);
                }
              }}
              className="rounded-full border border-border p-2.5 text-muted-foreground"
              aria-label="Limpar"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            disabled={tryOnBusy || bodyBusy}
            onClick={() => setPicker(true)}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground"
          >
            <Plus size={14} /> Peças
          </button>
        </div>
      </div>

      {/* Canvas — peças alinhadas à foto do corpo */}
      <div
        className="relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-3xl bg-[linear-gradient(180deg,var(--color-muted)_0%,var(--color-background)_100%)] shadow-soft"
      >
        {body ? (
          <img
            src={generatedUrl ?? body}
            alt={generatedUrl ? "Resultado do provador virtual com as peças vestidas" : "Sua foto de corpo inteiro usada no provador virtual"}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <button
            disabled={tryOnBusy || bodyBusy}
          onClick={() => bodyRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground"
          >
            <UserIcon size={40} strokeWidth={1.2} />
            <span className="text-xs uppercase tracking-[0.22em]">Envie uma foto sua</span>
            <span className="max-w-[220px] text-center text-[11px] normal-case tracking-normal">
              De corpo inteiro, contra um fundo simples. A foto fica privada e pode ser apagada aqui mesmo ou em Configurações → Minhas fotos.
            </span>
          </button>
        )}
        {bodyBusy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm text-xs uppercase tracking-[0.22em]">
            Preparando sua foto…
          </div>
        )}
        {tryOnBusy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 px-8 text-center backdrop-blur-sm">
            <Sparkles size={28} className="animate-pulse" />
            <span className="text-xs uppercase tracking-[0.22em]">Vestindo no seu corpo</span>
            <span className="text-[11px] text-muted-foreground">Ajustando curvas, pose, tamanho, tecido e caimento…</span>
          </div>
        )}
      </div>

      <input
        ref={bodyRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onBodyFile(e.target.files[0])}
      />

      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-xs">
        <span className="text-muted-foreground">
          {isPremium ? "Premium: provas no corpo sem limite." : `Free: ${tryOnLeft} de ${FREE_TRYON_DAILY} provas no corpo restantes hoje.`}
          {!isPremium && <Link to="/app/premium" className="ml-1 text-gold underline">Ver Premium</Link>}
        </span>
        {body && (
          <button
            disabled={tryOnBusy}
            onClick={() => { if (confirm("Apagar sua foto do provador?")) { actions.updateProfile({ bodyPhotoUrl: undefined }); setGeneratedUrl(null); } }}
            className="shrink-0 text-destructive underline"
          >Apagar foto</button>
        )}
      </div>

      {tryOnError && <p className="mt-3 text-center text-xs text-destructive">{tryOnError}</p>}

      <Button
        onClick={() => void dressSelectedGarments()}
        disabled={!body || items.length === 0 || tryOnBusy || bodyBusy || tryOnLeft === 0}
        className="mt-4 h-12 w-full rounded-full"
      >
        <Sparkles size={16} /> {tryOnBusy ? "Vestindo…" : "Vestir no corpo"}
      </Button>

      {/* Peças no provador */}
      {state.tryOn.length > 0 && (
        <div className="mt-4 space-y-2">
          {[...state.tryOn].sort((a, b) => b.z - a.z).map((t) => {
            const g = state.garments.find((x) => x.id === t.garmentId);
            if (!g) return null;
            return (
              <div key={t.garmentId} className="rounded-2xl bg-card p-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-xl bg-muted">
                    {g.imageUrl && <img src={g.imageUrl} className="h-full w-full object-contain" alt="" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{g.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{g.category}</p>
                  </div>
                  <button
                    onClick={() => void removeGarment(t.garmentId)}
                    disabled={tryOnBusy}
                    className="rounded-full p-2 hover:bg-muted"
                    aria-label="Remover"
                  >
                    <X size={16} className="text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {state.tryOn.length} {state.tryOn.length === 1 ? "peça selecionada" : "peças selecionadas"}
          </p>
        </div>
      )}

      {body && generatedUrl && state.tryOn.length > 0 && (
        <>
          <ShareButton
            kind="tryon"
            bodyUrl={generatedUrl ?? body}
            caption="Meu look"
            label="Compartilhar meu look"
            className="mt-4 w-full sheen"
            pieces={(generatedUrl ? [] : items)
              .map((t) => {
                const g = state.garments.find((x) => x.id === t.garmentId);
                return g?.imageUrl
                  ? { url: g.imageUrl, x: t.x, y: t.y, scale: t.scale, rotation: t.rotation, z: t.z }
                  : null;
              })
              .filter(Boolean) as { url: string; x: number; y: number; scale: number; rotation: number; z: number }[]}
          />
          <button
            onClick={() => setPublishing(true)}
            disabled={tryOnBusy}
            className="press mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-xs uppercase tracking-[0.2em] disabled:opacity-60"
          >
            <Users size={14} /> Publicar na comunidade
          </button>
        </>
      )}


      {body && (
        <button
          disabled={tryOnBusy || bodyBusy}
          onClick={() => bodyRef.current?.click()}
          className="mt-4 w-full rounded-full border border-border py-2.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
        >
          Trocar foto do corpo
        </button>
      )}


      {picker && <GarmentPicker body={body} busy={tryOnBusy} onSelect={toggleGarment} onClose={() => setPicker(false)} onAddNew={() => { setPicker(false); setAddingGarment(true); }} />}
      {addingGarment && <AddGarmentSheet onClose={() => setAddingGarment(false)} />}

      {publishing && generatedUrl && (
        <PublishLookSheet
          imageDataUrl={generatedUrl}
          authorName={state.profile.name}
          authorAvatar={state.profile.photoUrl ?? null}
          garments={items.flatMap((t) => {
            const g = state.garments.find((x) => x.id === t.garmentId);
            return g
              ? [{ name: g.name, category: g.category, color: g.color, material: g.material, pattern: g.pattern }]
              : [];
          })}
          onClose={() => setPublishing(false)}
        />
      )}
    </div>
  );
}

function GarmentPicker({ body, busy, onSelect, onClose, onAddNew }: { body?: string; busy: boolean; onSelect: (garment: Garment) => void; onClose: () => void; onAddNew: () => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const selected = new Set(state.tryOn.map((t) => t.garmentId));
  const list = state.garments.filter(
    (g) => !q || `${g.name} ${g.category} ${g.color}`.toLowerCase().includes(q.toLowerCase()),
  );
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="garment-picker-title" className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-lift sm:rounded-3xl">
        <div className="shrink-0 px-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 id="garment-picker-title" className="font-display text-2xl">Escolher peças</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar seleção"><X size={18} /></Button>
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar peças" placeholder="Buscar…" className="mt-4 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
          {state.garments.length === 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">Cadastre uma peça no armário para começar.</p>
              <Button onClick={onAddNew} className="mt-3"><Plus size={14} /> Cadastrar peça</Button>
            </div>
          )}
          {!body && state.garments.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Foto do corpo ainda não enviada.</p>}
          {state.garments.length > 0 && list.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Nenhuma peça encontrada.</p>}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {list.map((g) => (
              <Button key={g.id} variant="ghost" onClick={() => onSelect(g)} disabled={busy} aria-label={g.name} aria-pressed={selected.has(g.id)} className={`group relative h-auto aspect-square overflow-hidden rounded-lg bg-muted p-2 ${selected.has(g.id) ? "ring-2 ring-primary ring-inset" : ""}`}>
                {g.imageUrl ? <img src={g.imageUrl} className="h-full w-full object-contain" alt="" /> : <span className="font-display text-2xl text-muted-foreground">{g.name.slice(0, 1)}</span>}
                {selected.has(g.id) && <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-foreground"><Check size={14} /></span>}
              </Button>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-border px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
          <Button onClick={onClose} className="h-11 w-full rounded-full">Concluir seleção ({selected.size})</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
