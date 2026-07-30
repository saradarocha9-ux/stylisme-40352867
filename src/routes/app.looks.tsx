import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, User as UserIcon, X, RotateCcw, Sparkles } from "lucide-react";
import { useStore, actions, slotOf, type Garment } from "@/lib/store";
import { removeImageBackground } from "@/lib/bg-removal";
import { generateVirtualTryOn } from "@/lib/virtual-tryon.functions";
import { track } from "@/lib/track";
import { ShareButton } from "@/components/ShareButton";

export const Route = createFileRoute("/app/looks")({
  head: () => ({
    meta: [
      { title: "Provador virtual | Stylisme" },
      { name: "description", content: "Experimente suas roupas com caimento inteligente no corpo." },
      { property: "og:title", content: "Provador virtual | Stylisme" },
      { property: "og:description", content: "Experimente suas roupas com caimento inteligente no corpo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
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
  const bodyRef = useRef<HTMLInputElement>(null);

  const body = state.profile.bodyPhotoUrl;
  const items = useMemo(() => [...state.tryOn].sort((a, b) => a.z - b.z), [state.tryOn]);

  async function onBodyFile(f: File) {
    setBodyBusy(true);
    try {
      const url = await removeImageBackground(f);
      actions.tryOnClear();
      setGeneratedUrl(null);
      actions.updateProfile({ bodyPhotoUrl: url });
    } catch (e) {
      console.error(e);
      const r = new FileReader();
      r.onload = () => actions.updateProfile({ bodyPhotoUrl: r.result as string });
      r.readAsDataURL(f);
    } finally {
      setBodyBusy(false);
    }
  }

  async function renderGarments(garments: Garment[]) {
    if (!body || garments.length === 0) {
      setGeneratedUrl(null);
      return;
    }
    setTryOnBusy(true);
    setTryOnError(null);
    try {
      const result = await createTryOn({
        data: {
          bodyDataUrl: body,
          garments: garments.flatMap((garment) => garment.imageUrl ? [{
            dataUrl: garment.imageUrl,
            name: garment.name,
            category: garment.category,
            material: garment.material,
          }] : []),
        },
      });
      setGeneratedUrl(result.imageUrl);
    } catch (error) {
      setTryOnError(error instanceof Error ? error.message : "Não foi possível vestir as peças.");
      throw error;
    } finally {
      setTryOnBusy(false);
    }
  }

  async function addGarment(garment: Garment) {
    const current = items.flatMap((item) => {
      const found = state.garments.find((candidate) => candidate.id === item.garmentId);
      return found ? [found] : [];
    });
    const next = [...current.filter((item) => slotOf(item.category) !== slotOf(garment.category)), garment];
    await renderGarments(next);
    actions.tryOnAdd(garment.id);
    track("tryon");
    setPicker(false);
  }

  async function removeGarment(garmentId: string) {
    const remaining = items
      .filter((item) => item.garmentId !== garmentId)
      .flatMap((item) => {
        const found = state.garments.find((candidate) => candidate.id === item.garmentId);
        return found ? [found] : [];
      });
    actions.tryOnRemove(garmentId);
    try { await renderGarments(remaining); } catch { /* erro já exibido */ }
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
            alt={generatedUrl ? "Resultado do provador virtual" : "Você"}
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
    if (!body || !garment.imageUrl) return;
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
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-slow">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Escolher peça</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X size={18} /></button>
        </div>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="mt-4 w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none"
        />
        {state.garments.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">Cadastre peças no armário para começar a provar.</p>
        )}
        {fitError && <p className="mt-3 text-xs text-destructive">{fitError}</p>}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {list.map((g) => (
            <button
              key={g.id}
              onClick={() => void addWithDetectedFit(g)}
              disabled={fittingId !== null || busy || !body}
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
  );
}
