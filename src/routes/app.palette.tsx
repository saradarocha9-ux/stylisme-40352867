import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Sparkles, RefreshCw, Palette as PaletteIcon, Ban, Gem, Shirt, ShoppingBag, Check, Minus, X, History, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useStore, actions, type Garment } from "@/lib/store";
import { analyzeColorPalette, type ColorAnalysis } from "@/lib/color-ai.functions";
import { recommendFromPalette, type PaletteRecommendation } from "@/lib/palette-looks.functions";
import { savePaletteAnalysis, listPaletteAnalyses, deletePaletteAnalysis, type SavedAnalysis } from "@/lib/palette-history.functions";
import { track } from "@/lib/track";
import { ShareButton } from "@/components/ShareButton";



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
  const galleryRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
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
      track("palette");
      toast.success(`Sua cartela: ${analysis.season}`);
      try {
        const thumbnail = await fileToResizedDataUrl(file, 220);
        await savePaletteAnalysis({ data: { analysis, thumbnail } });
        setHistoryKey((k) => k + 1);
      } catch (err) {
        console.error("[palette] histórico", err);
        toast.error("Análise pronta, mas não consegui salvar no histórico.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui analisar a foto.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
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
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
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
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
            >
              <Camera size={12} />
              Tirar foto
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[11px] uppercase tracking-[0.18em] disabled:opacity-50"
            >
              {result ? <RefreshCw size={12} /> : <ImageIcon size={12} />}
              Galeria
            </button>
          </div>
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
      {result && (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-3xl border border-border bg-card p-5 text-center shadow-soft animate-rise">
          <p className="font-display text-xl">Mostre sua cartela</p>
          <p className="text-xs text-muted-foreground">Gere um card lindo pronto para os stories.</p>
          <ShareButton kind="palette" analysis={result} className="mt-2 sheen" label="Compartilhar minha cartela" />
        </div>
      )}

      {result && <Recommendations analysis={result} garments={state.garments} />}
      <HistorySection refreshKey={historyKey} />
      <div className="h-8" />
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function HistorySection({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listPaletteAnalyses()
      .then((data) => alive && setItems(data))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  async function remove(id: string) {
    try {
      await deletePaletteAnalysis({ data: { id } });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setCompare((prev) => prev.filter((i) => i !== id));
      toast.success("Análise removida");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui apagar.");
    }
  }

  function toggleCompare(id: string) {
    setCompare((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id].slice(-2),
    );
  }

  const selected = compare.map((id) => items.find((i) => i.id === id)).filter(Boolean) as SavedAnalysis[];

  return (
    <section className="mt-8">
      <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        <History size={12} /> Histórico de análises
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Carregando…
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Cada análise que você fizer fica salva aqui para comparar depois.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((item) => {
            const a = item.analysis;
            const open = openId === item.id;
            const picked = compare.includes(item.id);
            return (
              <article key={item.id} className="rounded-3xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={`Foto da análise de ${dateFmt.format(new Date(item.createdAt))}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <PaletteIcon size={16} strokeWidth={1.5} className="text-muted-foreground" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {dateFmt.format(new Date(item.createdAt))}
                    </p>
                    <p className="truncate font-display text-lg">{a.season}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : item.id)}
                      aria-label="Ver detalhes"
                      className="rounded-full p-2 text-muted-foreground"
                    >
                      <Eye size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label="Apagar análise"
                      className="rounded-full p-2 text-muted-foreground"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {a.palette.slice(0, 12).map((c) => (
                    <span key={c.hex + c.name} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => toggleCompare(item.id)}
                  className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] ${
                    picked ? "bg-foreground text-primary-foreground" : "border border-border text-muted-foreground"
                  }`}
                >
                  {picked ? "Selecionada" : "Comparar"}
                </button>

                {open && (
                  <div className="mt-3 space-y-3 border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Chip label="Subtom" value={a.undertone} />
                      <Chip label="Profundidade" value={a.depth} />
                      <Chip label="Contraste" value={a.contrast} />
                      <Chip label="Intensidade" value={a.chroma} />
                    </div>
                    {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                    <button
                      type="button"
                      onClick={() => {
                        actions.updateProfile({ colorAnalysis: a, colorAnalyzedAt: new Date(item.createdAt).getTime() });
                        toast.success("Cartela aplicada ao seu perfil");
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
                    >
                      Usar esta cartela
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selected.length === 2 && (
        <div className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Comparação</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            {selected.map((s) => (
              <div key={s.id}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {dateFmt.format(new Date(s.createdAt))}
                </p>
                <p className="font-display text-lg">{s.analysis.season}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>Subtom: {s.analysis.undertone || "—"}</li>
                  <li>Profundidade: {s.analysis.depth || "—"}</li>
                  <li>Contraste: {s.analysis.contrast || "—"}</li>
                  <li>Intensidade: {s.analysis.chroma || "—"}</li>
                </ul>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.analysis.palette.slice(0, 12).map((c) => (
                    <span key={c.hex + c.name} className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} title={c.name} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}


function Recommendations({ analysis, garments }: { analysis: ColorAnalysis; garments: Garment[] }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rec, setRec] = useState<PaletteRecommendation | null>(null);

  async function run() {
    if (garments.length === 0) {
      toast.error("Cadastre peças no armário primeiro.");
      return;
    }
    setLoading(true);
    try {
      const data = await recommendFromPalette({
        data: {
          analysis,
          garments: garments.map((g) => ({
            id: g.id,
            name: g.name,
            category: g.category,
            color: g.color,
            material: g.material,
            pattern: g.pattern,
            occasions: g.occasions,
            seasons: g.seasons,
          })),
        },
      });
      setRec(data);
      toast.success("Recomendações prontas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui gerar as recomendações.");
    } finally {
      setLoading(false);
    }
  }

  function tryOn(ids: string[]) {
    actions.tryOnClear();
    ids.forEach((id) => actions.tryOnAdd(id));
    navigate({ to: "/app/looks" });
  }

  const byId = (id: string) => garments.find((g) => g.id === id);
  const verdictStyle = {
    ideal: { icon: Check, cls: "text-foreground", label: "Ideal" },
    neutra: { icon: Minus, cls: "text-muted-foreground", label: "Neutra" },
    evitar: { icon: X, cls: "text-destructive", label: "Evitar" },
  } as const;

  return (
    <section className="mt-8 space-y-5">
      <div className="rounded-3xl bg-card p-5 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Seu armário × sua cartela</p>
        <p className="mt-1 font-display text-xl">Looks recomendados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A IA combina as peças do seu armário com as cores que mais valorizam você.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {loading ? "Gerando…" : rec ? "Gerar de novo" : "Gerar recomendações"}
        </button>
      </div>

      {rec?.headline && (
        <p className="rounded-3xl bg-card p-5 text-sm leading-relaxed text-muted-foreground shadow-soft">
          {rec.headline}
        </p>
      )}

      {rec?.looks.map((look, i) => (
        <article key={i} className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Look {i + 1}</p>
              <h3 className="font-display text-xl">{look.title}</h3>
            </div>
            <div className="flex gap-1">
              {look.colors.map((c) => (
                <span key={c.hex + c.name} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} title={c.name} />
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {look.garmentIds.map((id) => {
              const g = byId(id);
              if (!g) return null;
              return (
                <div key={id} className="w-20 shrink-0">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                    {g.imageUrl ? (
                      <img src={g.imageUrl} alt={g.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Shirt size={18} strokeWidth={1.5} className="text-muted-foreground" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{g.name}</p>
                </div>
              );
            })}
          </div>
          {look.why && <p className="mt-3 text-sm text-muted-foreground">{look.why}</p>}
          <button
            type="button"
            onClick={() => tryOn(look.garmentIds)}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[11px] uppercase tracking-[0.18em]"
          >
            Provar este look
          </button>
        </article>
      ))}

      {rec && rec.wardrobe.length > 0 && (
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Cores do seu armário</p>
          <ul className="mt-3 space-y-2">
            {rec.wardrobe.map((w) => {
              const g = byId(w.garmentId);
              const v = verdictStyle[w.verdict];
              const Icon = v.icon;
              return (
                <li key={w.garmentId} className="flex gap-2 text-sm">
                  <Icon size={14} className={`mt-0.5 shrink-0 ${v.cls}`} strokeWidth={1.8} />
                  <span>
                    <span className="text-foreground">{g?.name ?? "Peça"}</span>{" "}
                    <span className="text-muted-foreground">— {w.reason || v.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {rec && rec.shoppingColors.length > 0 && (
        <section className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <ShoppingBag size={12} /> Cores que faltam
          </p>
          <div className="mt-3 space-y-2">
            {rec.shoppingColors.map((c) => (
              <div key={c.hex + c.name} className="flex items-center gap-3">
                <span className="h-8 w-8 shrink-0 rounded-xl ring-1 ring-black/10" style={{ background: c.hex }} />
                <div className="min-w-0">
                  <p className="text-sm">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
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
