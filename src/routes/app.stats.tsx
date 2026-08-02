import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Crown, Lock } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useSubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/app/stats")({
  head: () => ({
    meta: [
      { title: "Estatísticas do guarda-roupa — Stylisme" },
      { name: "description", content: "Descubra padrões de uso, peças mais vestidas e cores dominantes do seu armário." },
      { property: "og:title", content: "Estatísticas do guarda-roupa — Stylisme" },
      { property: "og:description", content: "Descubra padrões de uso, peças mais vestidas e cores dominantes do seu armário." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/app/stats" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/app/stats" }],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { state } = useStore();
  const { isPremium, loading } = useSubscription();

  const data = useMemo(() => {
    const colors: Record<string, number> = {};
    const cats: Record<string, number> = {};
    state.garments.forEach((g) => {
      colors[g.color] = (colors[g.color] ?? 0) + 1;
      cats[g.category] = (cats[g.category] ?? 0) + 1;
    });
    const most = [...state.garments].sort((a, b) => b.wearCount - a.wearCount)[0];
    const least = [...state.garments].sort((a, b) => a.wearCount - b.wearCount)[0];
    const forgotten = state.garments.filter((g) => g.wearCount === 0);
    return {
      topColor: Object.entries(colors).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      topCat: Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
      most, least, forgotten,
    };
  }, [state]);

  const days = Math.max(1, Math.floor((Date.now() - state.profile.joinedAt) / 86400000));

  if (!loading && !isPremium) {
    return (
      <div className="px-5 pt-8">
        <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
          <ArrowLeft size={14} /> Voltar
        </Link>
        <h1 className="mt-4 font-display text-3xl">Estatísticas</h1>

        <div className="mt-8 rounded-3xl bg-premium p-8 text-center text-white shadow-lift">
          <Lock className="mx-auto text-gold" size={32} strokeWidth={1.5} />
          <p className="mt-4 text-[10px] uppercase tracking-[0.28em] opacity-70">Recurso Premium</p>
          <h2 className="mt-1 font-display text-2xl">Descubra seus padrões</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm opacity-80">
            Estatísticas completas do seu guarda-roupa — cores favoritas, peças esquecidas e mais.
          </p>
          <Link
            to="/app/premium"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-xs uppercase tracking-[0.24em] text-[oklch(0.16_0.01_60)]"
          >
            <Crown size={14} /> Desbloquear com Premium
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8">
      <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="mt-4 font-display text-3xl">Estatísticas</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Card label="Roupas" value={state.garments.length} />
        <Card label="Looks" value={state.looks.length} />
        <Card label="Cor mais usada" value={data.topColor} />
        <Card label="Categoria top" value={data.topCat} />
        <Card label="Peça mais usada" value={data.most?.name ?? "—"} />
        <Card label="Peça menos usada" value={data.least?.name ?? "—"} />
        <Card label="Peças esquecidas" value={data.forgotten.length} />
        <Card label="Dias no Stylisme" value={days} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl leading-tight">{value}</p>
    </div>
  );
}
