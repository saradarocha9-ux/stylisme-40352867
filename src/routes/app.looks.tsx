import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Plus, User as UserIcon, X, RotateCcw, Move, Check, Sparkles } from "lucide-react";
import { useStore, actions, type TryOnItem, type Garment } from "@/lib/store";
import { removeImageBackground } from "@/lib/bg-removal";
import { detectTryOnFit } from "@/lib/tryon-ai.functions";

export const Route = createFileRoute("/app/looks")({
  component: TryOnPage,
});

interface Rect { left: number; top: number; width: number; height: number }

function TryOnPage() {
  const { state } = useStore();
  const [picker, setPicker] = useState(false);
  const [bodyBusy, setBodyBusy] = useState(false);
  const [adjust, setAdjust] = useState(false);
  const [bodyRect, setBodyRect] = useState<Rect | null>(null);
  const bodyRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const body = state.profile.bodyPhotoUrl;
  const items = useMemo(() => [...state.tryOn].sort((a, b) => a.z - b.z), [state.tryOn]);

  /** Área realmente ocupada pela foto (object-contain) dentro do canvas. */
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.naturalWidth) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    setBodyRect({ left: (cw - width) / 2, top: (ch - height) / 2, width, height });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, body]);

  async function onBodyFile(f: File) {
    setBodyBusy(true);
    try {
      const url = await removeImageBackground(f);
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
              onClick={() => { if (confirm("Limpar o provador?")) actions.tryOnClear(); }}
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
        ref={canvasRef}
        className="relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-3xl bg-[linear-gradient(180deg,var(--color-muted)_0%,var(--color-background)_100%)] shadow-soft"
      >
        {body ? (
          <img
            ref={imgRef}
            src={body}
            alt="Você"
            onLoad={measure}
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

        {bodyRect && items.map((item) => {
          const g = state.garments.find((x) => x.id === item.garmentId);
          if (!g?.imageUrl) return null;
          return <FittedGarment key={item.garmentId} item={item} garment={g} rect={bodyRect} adjust={adjust} />;
        })}
      </div>

      <input
        ref={bodyRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onBodyFile(e.target.files[0])}
      />

      {state.tryOn.length > 0 && (
        <button
          onClick={() => setAdjust((a) => !a)}
          className={
            "mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[11px] uppercase tracking-[0.22em] transition " +
            (adjust ? "bg-foreground text-primary-foreground" : "border border-border text-muted-foreground")
          }
        >
          {adjust ? <><Check size={13} /> Concluir ajuste</> : <><Move size={13} /> Ajustar manualmente</>}
        </button>
      )}

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
                    onClick={() => actions.tryOnRemove(t.garmentId)}
                    className="rounded-full p-2 hover:bg-muted"
                    aria-label="Remover"
                  >
                    <X size={16} className="text-destructive" />
                  </button>
                </div>
                {adjust && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tamanho</span>
                    <input
                      type="range"
                      min={0.4}
                      max={2.5}
                      step={0.02}
                      value={t.scale}
                      onChange={(e) => actions.tryOnUpdate(t.garmentId, { scale: Number(e.target.value) })}
                      className="flex-1 accent-[var(--color-foreground)]"
                    />
                    <button
                      onClick={() => actions.tryOnResetFit(t.garmentId)}
                      className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      Auto
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <p className="pt-1 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {adjust ? "Arraste a peça sobre o corpo" : "Encaixe automático"}
          </p>
        </div>
      )}

      {body && (
        <button
          onClick={() => bodyRef.current?.click()}
          className="mt-4 w-full rounded-full border border-border py-2.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
        >
          Trocar foto do corpo
        </button>
      )}

      {picker && <GarmentPicker body={body} onClose={() => setPicker(false)} />}
    </div>
  );
}

/** Peça encaixada na área da foto do corpo; arrastável só no modo de ajuste. */
function FittedGarment({
  item, garment, rect, adjust,
}: { item: TryOnItem; garment: Garment; rect: Rect; adjust: boolean }) {
  const width = rect.width * 0.4 * item.scale;
  const height = item.height
    ? rect.height * item.height * (item.scale / (item.autoScale ?? item.scale))
    : undefined;

  function onPointerDown(e: React.PointerEvent) {
    if (!adjust) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const ox = item.x;
    const oy = item.y;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      actions.tryOnUpdate(garment.id, {
        x: Math.min(1.2, Math.max(-0.2, ox + (ev.clientX - startX) / rect.width)),
        y: Math.min(1.2, Math.max(-0.2, oy + (ev.clientY - startY) / rect.height)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      onPointerDown={onPointerDown}
      className={"absolute " + (adjust ? "cursor-grab touch-none" : "pointer-events-none")}
      style={{
        left: rect.left + rect.width * item.x,
        top: rect.top + rect.height * item.y,
        width,
        height,
        transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
        zIndex: item.z,
      }}
    >
      <img
        src={garment.imageUrl}
        alt={garment.name}
        draggable={false}
        className={"block w-full select-none " + (height ? "h-full object-contain" : "h-auto")}
        style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.12))" }}
      />
      {adjust && <div className="pointer-events-none absolute inset-0 rounded-lg border border-dashed border-foreground/40" />}
    </div>
  );
}

function GarmentPicker({ body, onClose }: { body?: string; onClose: () => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [fittingId, setFittingId] = useState<string | null>(null);
  const [fitError, setFitError] = useState<string | null>(null);
  const alreadyIn = new Set(state.tryOn.map((t) => t.garmentId));
  const list = state.garments.filter(
    (g) => !alreadyIn.has(g.id) && (!q || `${g.name} ${g.category} ${g.color}`.toLowerCase().includes(q.toLowerCase())),
  );

  async function addWithDetectedFit(garment: Garment) {
    if (!body || !garment.imageUrl) {
      actions.tryOnAdd(garment.id);
      onClose();
      return;
    }
    setFittingId(garment.id);
    setFitError(null);
    try {
      const fit = await detectTryOnFit({
        data: {
          bodyDataUrl: body,
          garmentDataUrl: garment.imageUrl,
          category: garment.category,
        },
      });
      actions.tryOnAdd(garment.id, fit);
      onClose();
    } catch (error) {
      console.error(error);
      setFitError("Não consegui detectar o corpo. A peça foi encaixada pelo modo padrão.");
      actions.tryOnAdd(garment.id);
      onClose();
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
              disabled={fittingId !== null}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-muted p-2 disabled:opacity-60"
            >
              {g.imageUrl ? (
                <img src={g.imageUrl} className="h-full w-full object-contain" alt={g.name} />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-2xl text-muted-foreground">{g.name.slice(0,1)}</div>
              )}
              {fittingId === g.id && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 text-[9px] uppercase tracking-[0.16em]">
                  <Sparkles size={16} className="animate-pulse" /> Detectando corpo
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
