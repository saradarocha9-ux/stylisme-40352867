import { useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { actions, type Category, type Occasion, type Season } from "@/lib/store";

const CATEGORIES: Category[] = ["Camiseta", "Camisa", "Blusa", "Vestido", "Saia", "Calça", "Shorts", "Casaco", "Sapato", "Acessório"];
const OCCASIONS: Occasion[] = ["Trabalho", "Faculdade", "Casual", "Festa", "Casamento", "Viagem", "Evento", "Academia", "Praia", "Jantar"];
const SEASONS: Season[] = ["Verão", "Outono", "Inverno", "Primavera"];

export function AddGarmentSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Camiseta");
  const [color, setColor] = useState("");
  const [pattern, setPattern] = useState("");
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggle<T>(arr: T[], v: T, setter: (a: T[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  async function handleFile(f: File) {
    setProcessing(true);
    // Real background removal needs an API (planned via Cloud). For now,
    // read image as data URL so cadastro funciona ponta-a-ponta.
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setProcessing(false);
    };
    reader.readAsDataURL(f);
  }

  function submit() {
    if (!name.trim() || !color.trim()) {
      alert("Preencha nome e cor.");
      return;
    }
    actions.addGarment({
      name: name.trim(),
      category,
      color: color.trim(),
      pattern: pattern.trim() || undefined,
      occasions,
      seasons,
      imageUrl,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in-slow">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Nova peça</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X size={18} /></button>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="mt-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted"
        >
          {processing ? (
            <span className="text-sm text-muted-foreground">Processando…</span>
          ) : imageUrl ? (
            <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload size={22} strokeWidth={1.5} />
              <span className="text-xs uppercase tracking-[0.2em]">Enviar foto</span>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="mt-4 space-y-3">
          <Field label="Nome">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ex: Camisa branca linho" />
          </Field>
          <Field label="Categoria">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cor"><input value={color} onChange={(e) => setColor(e.target.value)} className="input" placeholder="Bege" /></Field>
            <Field label="Estampa"><input value={pattern} onChange={(e) => setPattern(e.target.value)} className="input" placeholder="Lisa" /></Field>
          </div>
          <Field label="Ocasiões">
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <Chip key={o} active={occasions.includes(o)} onClick={() => toggle(occasions, o, setOccasions)}>{o}</Chip>
              ))}
            </div>
          </Field>
          <Field label="Estações">
            <div className="flex flex-wrap gap-1.5">
              {SEASONS.map((s) => (
                <Chip key={s} active={seasons.includes(s)} onClick={() => toggle(seasons, s, setSeasons)}>{s}</Chip>
              ))}
            </div>
          </Field>
        </div>

        <button onClick={submit} className="mt-6 w-full rounded-full bg-foreground py-3.5 text-sm uppercase tracking-[0.24em] text-primary-foreground">
          Salvar peça
        </button>
      </div>
      <style>{`.input{width:100%;background:var(--color-background);border:1px solid var(--color-border);border-radius:12px;padding:.7rem .9rem;font-size:.9rem;outline:none}.input:focus{border-color:var(--color-foreground)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"rounded-full border px-3 py-1 text-xs transition " + (active ? "border-foreground bg-foreground text-primary-foreground" : "border-border text-muted-foreground")}
    >
      {children}
    </button>
  );
}
