import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";


export const Route = createFileRoute("/app/favorites")({
  component: FavPage,
});

function FavPage() {
  const { state } = useStore();
  const [tab, setTab] = useState<"roupas" | "looks">("roupas");
  const roupas = state.garments.filter((g) => g.favorite);
  const looks = state.looks.filter((l) => l.favorite);

  return (
    <div className="px-5 pt-8">
      <div className="flex items-center gap-2">
        <Heart size={20} strokeWidth={1.5} className="text-gold" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Guardados</p>
          <h1 className="font-display text-3xl">Favoritos</h1>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
        <button onClick={() => setTab("roupas")} className={"rounded-full py-2 text-xs uppercase tracking-[0.2em] " + (tab === "roupas" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground")}>Roupas</button>
        <button onClick={() => setTab("looks")} className={"rounded-full py-2 text-xs uppercase tracking-[0.2em] " + (tab === "looks" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground")}>Looks</button>
      </div>

      {tab === "roupas" ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {roupas.length === 0 && <p className="col-span-2 mt-6 text-center text-sm text-muted-foreground">Nenhuma roupa favoritada.</p>}
          {roupas.map((g) => (
            <div key={g.id} className="aspect-[3/4] overflow-hidden rounded-2xl bg-card shadow-soft">
              {g.imageUrl ? <img src={g.imageUrl} className="h-full w-full object-cover" alt={g.name} /> : <div className="flex h-full items-center justify-center font-display text-3xl text-muted-foreground">{g.name.slice(0,1)}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {looks.length === 0 && <p className="text-center text-sm text-muted-foreground">Nenhum look favoritado.</p>}
          {looks.map((l) => (
            <div key={l.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="font-display text-lg">{l.name}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{l.garmentIds.length} peças</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
