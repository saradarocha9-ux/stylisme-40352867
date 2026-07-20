import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Plus, Trash2 } from "lucide-react";
import { useStore, actions } from "@/lib/store";

export const Route = createFileRoute("/app/looks")({
  component: LooksPage,
});

function LooksPage() {
  const { state } = useStore();
  return (
    <div className="px-5 pt-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Composições</p>
          <h1 className="font-display text-3xl">Seus looks</h1>
        </div>
        <Link to="/app/ai" className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground">
          <Plus size={14} /> Gerar
        </Link>
      </div>

      {state.looks.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-xl text-foreground">Nenhum look ainda</p>
          <p className="mt-2 text-sm text-muted-foreground">Deixe a Stylisme AI compor combinações a partir das suas peças.</p>
          <Link to="/app/ai" className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.24em] text-primary-foreground">
            Criar primeiro look
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {state.looks.map((look) => {
            const pieces = look.garmentIds.map((id) => state.garments.find((g) => g.id === id)).filter(Boolean);
            return (
              <article key={look.id} className="rounded-3xl bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl">{look.name}</h2>
                    {look.occasion && <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{look.occasion}{look.style ? ` · ${look.style}` : ""}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => actions.toggleLookFav(look.id)} className="rounded-full p-2 hover:bg-muted">
                      <Heart size={16} className={look.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} />
                    </button>
                    <button onClick={() => { if (confirm("Excluir look?")) actions.removeLook(look.id); }} className="rounded-full p-2 hover:bg-muted">
                      <Trash2 size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {pieces.map((p) => p && (
                    <div key={p.id} className="aspect-square overflow-hidden rounded-xl bg-muted">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center font-display text-lg text-muted-foreground">{p.name.slice(0, 1)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
