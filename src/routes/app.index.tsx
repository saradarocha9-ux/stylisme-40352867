import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Heart, Trash2, Crown, Camera, ScanSearch, Wand2, ArrowRight } from "lucide-react";
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

      {state.garments.length === 0 && (
        <section className="mt-6 border-y border-border py-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sua primeira combinação</p>
          <h2 className="mt-1 font-display text-2xl">Comece com uma peça</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <FirstStep icon={Camera} number="1" title="Fotografe" text="Use uma foto nítida da peça." />
            <FirstStep icon={ScanSearch} number="2" title="Confirme" text="A IA identifica os detalhes." />
            <FirstStep icon={Wand2} number="3" title="Combine" text="Adicione outra peça e gere sugestões." />
          </div>
          <button onClick={() => { tap(); setAdding(true); }} className="press-gold mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm text-primary-foreground">
            Adicionar minha primeira peça <ArrowRight size={15} />
          </button>
        </section>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

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

      {state.garments.length === 1 && (
        <div className="col-span-2 flex flex-col gap-2 rounded-2xl border border-border p-4 lg:col-span-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Ótimo começo. Adicione mais uma peça para a IA criar sua primeira combinação.</p>
          <button onClick={() => setAdding(true)} className="shrink-0 rounded-full bg-foreground px-4 py-2 text-xs text-primary-foreground">Adicionar outra</button>
        </div>
      )}

      {adding && <AddGarmentSheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function FirstStep({ icon: Icon, number, title, text }: { icon: React.ElementType; number: string; title: string; text: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"><Icon size={16} /></span><div><p className="text-xs font-medium">{number}. {title}</p><p className="mt-0.5 text-xs text-muted-foreground">{text}</p></div></div>;
}
