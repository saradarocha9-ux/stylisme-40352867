import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, Trash2, User as UserIcon, X, Layers, RotateCcw } from "lucide-react";
import { useStore, actions, type TryOnItem, type Garment } from "@/lib/store";
import { removeImageBackground } from "@/lib/bg-removal";

export const Route = createFileRoute("/app/looks")({
  component: TryOnPage,
});

function TryOnPage() {
  const { state } = useStore();
  const [picker, setPicker] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [bodyBusy, setBodyBusy] = useState(false);
  const bodyRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const body = state.profile.bodyPhotoUrl;
  const items = useMemo(() => [...state.tryOn].sort((a, b) => a.z - b.z), [state.tryOn]);

  async function onBodyFile(f: File) {
    setBodyBusy(true);
    try {
      const url = await removeImageBackground(f);
      actions.updateProfile({ bodyPhotoUrl: url });
    } catch (e) {
      console.error(e);
      // fallback sem remoção
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
              onClick={() => { if (confirm("Limpar o provador?")) { actions.tryOnClear(); setSelected(null); } }}
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

      {/* Canvas */}
      <div
        ref={canvasRef}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
        className="relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-3xl bg-[linear-gradient(180deg,var(--color-muted)_0%,var(--color-background)_100%)] shadow-soft"
      >
        {body ? (
          <img src={body} alt="Você" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
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

        {items.map((item) => {
          const g = state.garments.find((x) => x.id === item.garmentId);
          if (!g?.imageUrl) return null;
          return (
            <DraggableGarment
              key={item.garmentId}
              item={item}
              garment={g}
              containerRef={canvasRef}
              selected={selected === item.garmentId}
              onSelect={() => { setSelected(item.garmentId); actions.tryOnBringToFront(item.garmentId); }}
            />
          );
        })}
      </div>

      <input
        ref={bodyRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onBodyFile(e.target.files[0])}
      />

      {/* Controles do item selecionado */}
      {selected && (() => {
        const item = state.tryOn.find((t) => t.garmentId === selected);
        const g = state.garments.find((x) => x.id === selected);
        if (!item || !g) return null;
        return (
          <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl bg-muted">
                {g.imageUrl && <img src={g.imageUrl} className="h-full w-full object-contain" alt="" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{g.category}</p>
              </div>
              <button
                onClick={() => { actions.tryOnRemove(selected); setSelected(null); }}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="Remover"
              >
                <X size={16} className="text-destructive" />
              </button>
            </div>
            <Slider label="Tamanho" min={0.3} max={2.5} step={0.02} value={item.scale} onChange={(v) => actions.tryOnUpdate(selected, { scale: v })} />
            <Slider label="Rotação" min={-180} max={180} step={1} value={item.rotation} onChange={(v) => actions.tryOnUpdate(selected, { rotation: v })} />
            <button
              onClick={() => actions.tryOnBringToFront(selected)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              <Layers size={12} /> Trazer para frente
            </button>
          </div>
        );
      })()}

      {body && (
        <button
          onClick={() => bodyRef.current?.click()}
          className="mt-4 w-full rounded-full border border-border py-2.5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
        >
          Trocar foto do corpo
        </button>
      )}

      {picker && <GarmentPicker onClose={() => setPicker(false)} />}
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mt-3 block">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>{label}</span>
        <span>{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full accent-foreground"
      />
    </label>
  );
}

function DraggableGarment({
  item, garment, containerRef, selected, onSelect,
}: {
  item: TryOnItem;
  garment: Garment;
  containerRef: React.RefObject<HTMLDivElement | null>;
  selected: boolean;
  onSelect: () => void;
}) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; w: number; h: number } | null>(null);
  const pinchRef = useRef<{ dist: number; scale: number; rot: number; angle: number } | null>(null);
  const pointers = useRef<Map<number, PointerEvent | React.PointerEvent>>(new Map());

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, e);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (pointers.current.size === 1) {
      dragRef.current = {
        startX: e.clientX, startY: e.clientY,
        origX: item.x, origY: item.y,
        w: rect.width, h: rect.height,
      };
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
      pinchRef.current = {
        dist: Math.hypot(dx, dy),
        scale: item.scale,
        rot: item.rotation,
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, e);
    if (pointers.current.size === 2 && pinchRef.current) {
      const [a, b] = Array.from(pointers.current.values());
      const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
      const dist = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const scale = Math.min(2.5, Math.max(0.3, pinchRef.current.scale * (dist / pinchRef.current.dist)));
      const rotation = pinchRef.current.rot + (angle - pinchRef.current.angle);
      actions.tryOnUpdate(item.garmentId, { scale, rotation });
    } else if (pointers.current.size === 1 && dragRef.current) {
      const d = dragRef.current;
      const nx = Math.min(1.1, Math.max(-0.1, d.origX + (e.clientX - d.startX) / d.w));
      const ny = Math.min(1.1, Math.max(-0.1, d.origY + (e.clientY - d.startY) / d.h));
      actions.tryOnUpdate(item.garmentId, { x: nx, y: ny });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) dragRef.current = null;
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        left: `${item.x * 100}%`,
        top: `${item.y * 100}%`,
        transform: `translate(-50%,-50%) rotate(${item.rotation}deg) scale(${item.scale})`,
        width: "40%",
        zIndex: item.z,
        touchAction: "none",
        cursor: "grab",
      }}
      className={selected ? "outline outline-1 outline-foreground/60 rounded-lg" : ""}
    >
      <img
        src={garment.imageUrl}
        alt={garment.name}
        draggable={false}
        className="pointer-events-none block h-auto w-full select-none"
        style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.12))" }}
      />
    </div>
  );
}

function GarmentPicker({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const alreadyIn = new Set(state.tryOn.map((t) => t.garmentId));
  const list = state.garments.filter(
    (g) => !alreadyIn.has(g.id) && (!q || `${g.name} ${g.category} ${g.color}`.toLowerCase().includes(q.toLowerCase())),
  );
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
        <div className="mt-4 grid grid-cols-3 gap-2">
          {list.map((g) => (
            <button
              key={g.id}
              onClick={() => { actions.tryOnAdd(g.id); onClose(); }}
              className="group aspect-square overflow-hidden rounded-2xl bg-muted p-2"
            >
              {g.imageUrl ? (
                <img src={g.imageUrl} className="h-full w-full object-contain" alt={g.name} />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-2xl text-muted-foreground">{g.name.slice(0,1)}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
