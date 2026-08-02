import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Heart, Trash2, Crown } from "lucide-react";
import { useStore, actions, type Category } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { AddGarmentSheet } from "@/components/AddGarmentSheet";
import { StreakCard } from "@/components/StreakCard";

import { tap } from "@/lib/haptics";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Meu armário digital — Stylisme" },
      { name: "description", content: "Veja, filtre e organize todas as peças do seu guarda-roupa digital em um só lugar." },
      { property: "og:title", content: "Meu armário digital — Stylisme" },
      { property: "og:description", content: "Veja, filtre e organize todas as peças do seu guarda-roupa digital em um só lugar." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/app" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/app" }],
  }),
  component: Wardrobe,
});

const CATEGORIES: (Category | "Tudo")[] = ["Tudo", "Camiseta", "Camisa", "Blusa", "Vestido", "Saia", "Calça", "Shorts", "Casaco", "Sapato", "Acessório"];

function Wardrobe() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Tudo");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    return state.garments.filter((g) => {
      if (cat !== "Tudo" && g.category !== cat) return false;
      if (query && !`${g.name} ${g.color} ${g.category}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [state.garments, cat, query]);

  return (
    <div className="px-5 pt-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={36} />
          <div>
            <h1 className="font-display text-2xl leading-none">Stylisme<span className="sr-only"> — Meu armário</span></h1>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Seu armário</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StreakCard gamify={state.gamify} compact />
          {state.profile.plan === "free" && (
            <Link to="/app/premium" className="press flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs">
              <Crown size={12} className="text-gold" /> Premium
            </Link>
          )}
        </div>
      </header>

      {state.garments.length > 0 && (
        <div className="mt-6 animate-rise">
          <StreakCard gamify={state.gamify} />
        </div>
      )}


      <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-soft">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, cor, categoria…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 -mx-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "press shrink-0 rounded-full border px-4 py-1.5 text-xs transition " +
                (cat === c
                  ? "border-foreground bg-foreground text-primary-foreground shadow-soft"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">

        <button
          onClick={() => { tap(); setAdding(true); }}
          className="press aspect-[3/4] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground transition"
        >
          <Plus size={22} strokeWidth={1.5} className="animate-float" />
          <span className="text-xs uppercase tracking-[0.2em]">Adicionar</span>
        </button>

        {filtered.map((g, i) => (
          <div
            key={g.id}
            style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            className="group press lift cv-auto relative aspect-[3/4] animate-rise overflow-hidden rounded-2xl bg-card shadow-soft"
          >
            {g.imageUrl ? (
              <img src={g.imageUrl} alt={g.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="font-display text-3xl text-muted-foreground">{g.name.slice(0, 1)}</span>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
              <p className="truncate text-sm font-medium">{g.name}</p>
              <p className="text-[10px] uppercase tracking-widest opacity-80">{g.category} · {g.color}</p>
            </div>
            <button
              onClick={() => { tap(); actions.toggleGarmentFav(g.id); }}
              className="press absolute right-2 top-2 rounded-full bg-white/80 p-1.5 backdrop-blur"
              aria-label="Favoritar"
            >
              <Heart size={14} className={g.favorite ? "fill-red-500 text-red-500" : "text-foreground"} />
            </button>
            <button
              onClick={() => { if (confirm(`Remover "${g.name}"?`)) actions.removeGarment(g.id); }}
              className="press absolute left-2 top-2 rounded-full bg-white/80 p-1.5 opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Remover"
            >
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && state.garments.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Seu armário está vazio. Toque em <span className="text-foreground">Adicionar</span> para cadastrar sua primeira peça.
        </p>
      )}

      {adding && <AddGarmentSheet onClose={() => setAdding(false)} />}
    </div>
  );
}
