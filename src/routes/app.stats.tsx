import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/stats")({
  component: StatsPage,
});

function StatsPage() {
  const { state } = useStore();

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
