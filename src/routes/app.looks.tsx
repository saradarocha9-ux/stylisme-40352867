import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { Plus, User as UserIcon, X, RotateCcw } from "lucide-react";
import { useStore, actions, fitFor, type TryOnItem, type Garment } from "@/lib/store";
import { removeImageBackground } from "@/lib/bg-removal";

export const Route = createFileRoute("/app/looks")({
  component: TryOnPage,
});

function TryOnPage() {
  const { state } = useStore();
  const [picker, setPicker] = useState(false);
  const [bodyBusy, setBodyBusy] = useState(false);
  const bodyRef = useRef<HTMLInputElement>(null);

  const body = state.profile.bodyPhotoUrl;
  const items = useMemo(() => [...state.tryOn].sort((a, b) => a.z - b.z), [state.tryOn]);

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

      {/* Canvas — as peças se encaixam automaticamente no corpo */}
      <div className="relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-3xl bg-[linear-gradient(180deg,var(--color-muted)_0%,var(--color-background)_100%)] shadow-soft">
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
          return <FittedGarment key={item.garmentId} item={item} garment={g} />;
        })}
      </div>

      <input
        ref={bodyRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onBodyFile(e.target.files[0])}
      />

      {/* Peças no provador */}
      {state.tryOn.length > 0 && (
        <div className="mt-4 space-y-2">
          {[...state.tryOn].sort((a, b) => b.z - a.z).map((t) => {
            const g = state.garments.find((x) => x.id === t.garmentId);
            if (!g) return null;
            return (
              <div key={t.garmentId} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
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
            );
          })}
          <p className="pt-1 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Encaixe automático · sem ajustes manuais
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

      {picker && <GarmentPicker onClose={() => setPicker(false)} />}
    </div>
  );
}

/** Peça posicionada automaticamente — não é arrastável nem redimensionável. */
function FittedGarment({ item, garment }: { item: TryOnItem; garment: Garment }) {
  const fit = fitFor(garment.category);
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${fit.x * 100}%`,
        top: `${fit.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${fit.scale})`,
        transformOrigin: "center",
        width: "40%",
        zIndex: item.z,
      }}
    >
      <img
        src={garment.imageUrl}
        alt={garment.name}
        draggable={false}
        className="block h-auto w-full select-none"
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
