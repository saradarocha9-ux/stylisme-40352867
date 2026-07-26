import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Wand2, Send, Sparkles, Crown } from "lucide-react";
import { useStore, actions, generateLook, type Occasion, type Style } from "@/lib/store";
import { useSubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/app/ai")({
  component: AiPage,
});

const OCC: Occasion[] = ["Trabalho", "Faculdade", "Casual", "Festa", "Casamento", "Viagem", "Evento", "Academia", "Praia", "Jantar"];
const STY: Style[] = ["Elegante", "Minimalista", "Streetwear", "Casual", "Fashionista", "Vintage", "Romântico", "Esportivo"];
const FREE_DAILY_LIMIT = 3;

interface Msg { role: "ai" | "user"; text: string; options?: string[][] }

function todayKey() {
  return "stylisme:ai:" + new Date().toISOString().slice(0, 10);
}
function usedToday(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(todayKey()) ?? 0);
}
function bumpUsed(): number {
  const next = usedToday() + 1;
  localStorage.setItem(todayKey(), String(next));
  return next;
}

function AiPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [occ, setOcc] = useState<Occasion | undefined>();
  const [style, setStyle] = useState<Style | undefined>();
  const [accessories, setAccessories] = useState(true);
  const [used, setUsed] = useState<number>(usedToday());
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Olá, eu sou a Stylisme AI. Escolha ocasião e estilo, ou me diga o que você precisa vestir." },
  ]);
  const [input, setInput] = useState("");

  const remaining = isPremium ? Infinity : Math.max(0, FREE_DAILY_LIMIT - used);

  function generate() {
    if (!isPremium && remaining <= 0) {
      setMsgs((m) => [...m, { role: "ai", text: "Você atingiu o limite diário do plano Free (3 looks). Faça upgrade para IA ilimitada." }]);
      return;
    }
    if (state.garments.length < 2) {
      setMsgs((m) => [...m, { role: "ai", text: "Cadastre pelo menos 2 peças no seu armário para eu compor um look." }]);
      return;
    }
    const ids = generateLook(state.garments, { occasion: occ, style, accessories });
    if (!ids.length) {
      setMsgs((m) => [...m, { role: "ai", text: "Não encontrei uma combinação com esses filtros. Tente sem filtros." }]);
      return;
    }
    if (!isPremium) setUsed(bumpUsed());
    // Envia as peças diretamente para o Provador
    actions.tryOnClear();
    ids.forEach((id) => actions.tryOnAdd(id));
    setMsgs((m) => [
      ...m,
      { role: "user", text: `Monte um look ${style ?? ""} ${occ ? `para ${occ}` : ""}`.trim() },
      { role: "ai", text: `Selecionei ${ids.length} peças. Abrindo o Provador para você experimentar…`, ids },
    ]);
    setTimeout(() => navigate({ to: "/app/looks" }), 700);
  }


  function send() {
    if (!input.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "ai", text: "Ótimo. Selecione a ocasião abaixo e toque em Gerar look." }]);
    }, 400);
  }

  return (
    <div className="px-5 pt-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wand2 size={20} className="text-gold" strokeWidth={1.5} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Assistente</p>
            <h1 className="font-display text-3xl">Stylisme AI</h1>
          </div>
        </div>
        {isPremium ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-primary-foreground">
            <Crown size={10} /> Ilimitado
          </span>
        ) : (
          <Link to="/app/premium" className="rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {remaining}/{FREE_DAILY_LIMIT} hoje
          </Link>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "ai" ? "flex" : "flex justify-end"}>
            <div className={"max-w-[85%] rounded-2xl px-4 py-3 text-sm " + (m.role === "ai" ? "bg-card text-foreground shadow-soft" : "bg-foreground text-primary-foreground")}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Ocasião</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OCC.map((o) => (
            <button key={o} onClick={() => setOcc(occ === o ? undefined : o)} className={chip(occ === o)}>{o}</button>
          ))}
        </div>
        <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Estilo</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STY.map((s) => (
            <button key={s} onClick={() => setStyle(style === s ? undefined : s)} className={chip(style === s)}>{s}</button>
          ))}
        </div>
        <label className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={accessories} onChange={(e) => setAccessories(e.target.checked)} />
          Incluir acessórios
        </label>

        <button onClick={generate} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm uppercase tracking-[0.24em] text-primary-foreground">
          <Sparkles size={14} /> Gerar look
        </button>
      </section>

      <div className="mt-4 flex gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-soft">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Pergunte à Stylisme AI…"
          className="w-full bg-transparent text-sm outline-none"
        />
        <button onClick={send} className="rounded-full bg-foreground p-2 text-primary-foreground"><Send size={14} /></button>
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return "rounded-full border px-3 py-1 text-xs transition " + (active ? "border-foreground bg-foreground text-primary-foreground" : "border-border text-muted-foreground");
}
