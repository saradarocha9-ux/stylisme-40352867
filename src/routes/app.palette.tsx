import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, RefreshCw, Palette as PaletteIcon, Ban, Gem } from "lucide-react";
import { toast } from "sonner";
import { useStore, actions } from "@/lib/store";
import { analyzeColorPalette, type ColorAnalysis } from "@/lib/color-ai.functions";

export const Route = createFileRoute("/app/palette")({
  component: PalettePage,
  head: () => ({
    meta: [
      { title: "Paleta de Cores Pessoal | Stylisme" },
      { name: "description", content: "Descubra sua cartela de coloração pessoal — estação, subtom e contraste — a partir de uma foto do seu rosto." },
      { property: "og:title", content: "Paleta de Cores Pessoal | Stylisme" },
      { property: "og:description", content: "Descubra sua cartela de coloração pessoal a partir de uma foto do seu rosto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

async function fileToResizedDataUrl(file: File, max = 900): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

const familyGradient: Record<string, string> = {
  Primavera: "linear-gradient(135deg,#FFD9A0,#FF9A8B,#7ED9A7)",
  Verão: "linear-gradient(135deg,#CBD7F5,#E7C6DE,#A8D8D8)",
  Outono: "linear-gradient(135deg,#E0A05A,#B4622E,#7C8C4B)",
  Inverno: "linear-gradient(135deg,#1F2A44,#7A2E5C,#2E8B8B)",
};

function PalettePage() {
  const { state } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const photo = state.profile.facePhotoUrl;
  const result = state.profile.colorAnalysis;

  async function onPick(file?: File | null) {
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      actions.updateProfile({ facePhotoUrl: dataUrl });
      const analysis: ColorAnalysis = await analyzeColorPalette({ data: { dataUrl } });
      actions.updateProfile({ colorAnalysis: analysis, colorAnalyzedAt: Date.now() });
      toast.success(`Sua cartela: ${analysis.season}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui analisar a foto.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="px-5 pt-8">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Coloração pessoal</p>
      <h1 className="font-display text-3xl">Paleta de cores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Envie uma foto do seu rosto com luz natural e sem maquiagem pesada.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      <div className="mt-6 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-soft">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted"
          aria-label="Enviar foto do rosto"
        >
          {photo ? (
            <img src={photo} alt="Sua foto de rosto" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Camera size={22} strokeWidth={1.5} className="text-muted-foreground" />
            </span>
          )}
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 size={20} className="animate-spin" />
            </span>
          )}
        </button>
        <div className="flex-1">
          <p className="font-display text-lg">{photo ? "Sua foto" : "Nenhuma foto ainda"}</p>
          <p className="text-xs text-muted-foreground">
            {loading ? "Analisando tonalidade, subtom e contraste…" : "A IA identifica sua estação de cor."}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
          >
            {result ? <RefreshCw size={12} /> : <Sparkles size={12} />}
            {result ? "Refazer análise" : "Analisar"}
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center">
          <PaletteIcon size={26} strokeWidth={1.2} className="mx-auto text-muted-foreground" />
          <p className="mt-3 font-display text-xl">Descubra sua cartela</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Primavera Brilhante, Verão Suave, Outono Quente, Inverno Profundo… e as 12 cores que mais valorizam você.
          </p>
        </div>
      )}

      {result && <Result data={result} />}
      <div className="h-8" />
    </div>
  );
}

function Result({ data }: { data: ColorAnalysis }) {
  const gradient = familyGradient[data.seasonFamily] ?? familyGradient.Primavera;
  return (
    <div className="mt-6 space-y-5">
      <div className="relative overflow-hidden rounded-3xl p-6 shadow-lift" style={{ background: gradient }}>
        <div className="absolute inset-0 bg-background/10" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.24em] text-foreground/70">Sua estação</p>
          <h2 className="font-display text-3xl text-foreground">{data.season}</h2>
          {data.subtitle && <p className="mt-1 text-sm text-foreground/80">{data.subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Chip label="Subtom" value={data.undertone} />
        <Chip label="Profundidade" value={data.depth} />
        <Chip label="Contraste" value={data.contrast} />
        <Chip label="Intensidade" value={data.chroma} />
      </div>

      {data.description && (
        <p className="rounded-3xl bg-card p-5 text-sm leading-relaxed text-muted-foreground shadow-soft">
          {data.description}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Chip label="Pele" value={data.skinTone} />
        <Chip label="Cabelo" value={data.hairTone} />
        <Chip label="Olhos" value={data.eyeTone} />
      </div>

      {data.palette.length > 0 && (
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Sua cartela</p>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {data.palette.map((c) => (
              <div key={c.hex + c.name} className="text-center">
                <div
                  className="aspect-square w-full rounded-2xl shadow-soft ring-1 ring-black/5"
                  style={{ background: c.hex }}
                  title={`${c.name} ${c.hex}`}
                />
                <p className="mt-1 truncate text-[10px] text-muted-foreground">{c.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.avoid.length > 0 && (
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <Ban size={12} /> Evite
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {data.avoid.map((c) => (
              <div key={c.hex + c.name} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
                <span className="text-xs text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.metals.length > 0 && (
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <Gem size={12} /> Metais
          </p>
          <p className="mt-2 font-display text-xl">{data.metals.join(" · ")}</p>
        </section>
      )}

      {data.tips.length > 0 && (
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Dicas</p>
          <ul className="mt-3 space-y-2">
            {data.tips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <Sparkles size={14} className="mt-0.5 shrink-0 text-foreground" strokeWidth={1.5} />
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-soft">
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || "—"}</p>
    </div>
  );
}
