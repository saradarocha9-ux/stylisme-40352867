import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, User as UserIcon, X, RotateCcw, Sparkles, Users } from "lucide-react";
import { useStore, actions, slotOf, type Garment } from "@/lib/store";
import { generateVirtualTryOn } from "@/lib/virtual-tryon.functions";
import { track } from "@/lib/track";
import { resizeDataUrl } from "@/lib/image-resize";
import { PublishLookSheet } from "@/components/PublishLookSheet";

import { ShareButton } from "@/components/ShareButton";

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
  const [picker, setPicker] = useState(false);
  const [bodyBusy, setBodyBusy] = useState(false);
  const [tryOnBusy, setTryOnBusy] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const bodyRef = useRef<HTMLInputElement>(null);
  const initialLookRendered = useRef(false);

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
    const valid = garments.filter((garment) => !!garment.imageUrl).slice(0, 5);
    if (!base || valid.length === 0) {
      setGeneratedUrl(null);
      return;
    }
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
    } catch (error) {
      setTryOnError(error instanceof Error ? error.message : "Não foi possível vestir as peças.");
      throw error;
    } finally {
      setTryOnBusy(false);
    }
  }


  async function addGarment(garment: Garment) {
    initialLookRendered.current = true;
    const current = items.flatMap((item) => {
      const found = state.garments.find((candidate) => candidate.id === item.garmentId);
      return found ? [found] : [];
    });
    const kept = current.filter((item) => slotOf(item.category) !== slotOf(garment.category));
    // A peça entra na lista na hora: antes ela só aparecia se a geração desse
    // certo, e o clique parecia não fazer nada.
    for (const item of current) {
      if (slotOf(item.category) === slotOf(garment.category)) actions.tryOnRemove(item.id);
    }
    actions.tryOnAdd(garment.id);
    track("tryon");
    setPicker(false);
    // Sem foto do corpo não há o que gerar — a peça fica listada mesmo assim.
    if (!body) return;
    // Sempre parte da foto original. Reprocessar uma imagem já gerada encolhia
    // a pessoa e ampliava peças a cada nova rodada.
    await renderGarments([...kept, garment], body);
  }


  async function removeGarment(garmentId: string) {
    const remaining = items
      .filter((item) => item.garmentId !== garmentId)
      .flatMap((item) => {
        const found = state.garments.find((candidate) => candidate.id === item.garmentId);
        return found?.imageUrl ? [found] : [];
      });
    actions.tryOnRemove(garmentId);
    setTryOnError(null);
    if (remaining.length === 0) {
      setGeneratedUrl(null);
      return;
    }
    // Sempre refaz a partir da foto original, para a peça removida sumir de verdade.
    try { await renderGarments(remaining, body); } catch { /* erro já exibido */ }
  }

  // Looks enviados pela Stylisme AI e pela paleta chegam com as peças já no
  // estado do provador; gere o resultado assim que a tela abrir.
  useEffect(() => {
    if (initialLookRendered.current || !body || items.length === 0) return;
    const garments = items.flatMap((item) => {
      const garment = state.garments.find((candidate) => candidate.id === item.garmentId);
      return garment?.imageUrl ? [garment] : [];
    });
    if (garments.length === 0) return;
    initialLookRendered.current = true;
    void renderGarments(garments, body).catch(() => undefined);
  }, [body, items, state.garments]);


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
            onClick={() => setPicker(true)}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground"
          >
            <Plus size={14} /> Peça
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
            onClick={() => bodyRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground"
          >
            <UserIcon size={40} strokeWidth={1.2} />
            <span className="text-xs uppercase tracking-[0.22em]">Envie uma foto sua</span>
            <span className="max-w-[220px] text-center text-[11px] normal-case tracking-normal">
              De corpo inteiro, contra um fundo simples. Removemos o fundo automaticamente.
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

      {tryOnError && <p className="mt-3 text-center text-xs text-destructive">{tryOnError}</p>}

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
            Caimento gerado automaticamente no seu corpo
          </p>
        </div>
      )}

      {body && state.tryOn.length > 0 && (
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
          onClick={() => bodyRef.current?.click()}
          className="mt-4 w-full rounded-full border border-border py-2.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
        >
          Trocar foto do corpo
        </button>
      )}


      {picker && <GarmentPicker body={body} busy={tryOnBusy} onSelect={addGarment} onClose={() => setPicker(false)} />}

      {publishing && body && (
        <PublishLookSheet
          imageDataUrl={generatedUrl ?? body}
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

function GarmentPicker({ body, busy, onSelect, onClose }: { body?: string; busy: boolean; onSelect: (garment: Garment) => Promise<void>; onClose: () => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [fittingId, setFittingId] = useState<string | null>(null);
  const [fitError, setFitError] = useState<string | null>(null);
  const alreadyIn = new Set(state.tryOn.map((t) => t.garmentId));
  const list = state.garments.filter(
    (g) => !alreadyIn.has(g.id) && (!q || `${g.name} ${g.category} ${g.color}`.toLowerCase().includes(q.toLowerCase())),
  );

  async function addWithDetectedFit(garment: Garment) {
    setFittingId(garment.id);
    setFitError(null);
    try {
      await onSelect(garment);
    } catch (error) {
      console.error(error);
      setFitError(error instanceof Error ? error.message : "Não consegui detectar o corpo e a peça. Tente outra foto.");
    } finally {
      setFittingId(null);
    }
  }
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  if (typeof document === "undefined") return null;
  // Portal: a tela do app usa transform/will-change, o que prende elementos
  // "fixed" dentro dela e jogava a folha para fora da área visível.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-slow">
      <div className="flex w-full max-w-md max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-card shadow-lift">
        <div className="shrink-0 px-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Escolher peça</h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X size={18} /></button>
          </div>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="mt-4 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        {state.garments.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">Cadastre peças no armário para começar a provar.</p>
        )}
        {!body && state.garments.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Envie uma foto sua de corpo inteiro para ver o caimento. As peças escolhidas já ficam salvas no provador.
          </p>
        )}
        {fitError && <p className="mt-3 text-xs text-destructive">{fitError}</p>}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {list.map((g) => (
            <button
              key={g.id}
              onClick={() => void addWithDetectedFit(g)}
              disabled={fittingId !== null || busy}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-muted p-2 disabled:opacity-60"
            >
              {g.imageUrl ? (
                <img src={g.imageUrl} className="h-full w-full object-contain" alt={g.name} />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-2xl text-muted-foreground">{g.name.slice(0,1)}</div>
              )}
              {fittingId === g.id && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 text-[9px] uppercase tracking-[0.16em]">
                   <Sparkles size={16} className="animate-pulse" /> Vestindo peça
                </span>
              )}
            </button>
          ))}
        </div>
        </div>
      </div>
      </div>
    </div>,
    document.body,
  );
}
