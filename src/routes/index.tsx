import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { ArrowRight, CalendarDays, Camera, Check, Shirt, Sparkles, Wand2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stylisme — Escolha o que vestir com as roupas que você já tem" },
      { name: "description", content: "Cadastre suas peças, receba combinações com IA e planeje o que vestir sem comprar mais roupa." },
      { property: "og:title", content: "Stylisme — Seu armário, combinações melhores" },
      { property: "og:description", content: "Transforme as roupas que você já tem em combinações úteis para cada ocasião." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/" },
      { property: "og:image", content: "https://stylisme.company/og-stylisme.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://stylisme.company/og-stylisme.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/" }],
  }),
  component: Home,
});

const benefits = [
  { icon: Camera, title: "Cadastre sem esforço", text: "Fotografe a peça. A IA remove o fundo e identifica os detalhes." },
  { icon: Wand2, title: "Receba combinações", text: "Escolha a ocasião e veja até três sugestões com as roupas do seu armário." },
  { icon: CalendarDays, title: "Planeje sua semana", text: "Salve suas escolhas e volte sabendo o que vestir." },
];

function Home() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  // Quem já entrou (inclusive voltando do Google) vai direto para o app.
  useEffect(() => {
    if (!loading && session) void navigate({ to: "/app", replace: true });
  }, [loading, session, navigate]);
  return (
    <main className="min-h-screen bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2"><Logo size={36} /><span className="font-display text-2xl">Stylisme</span></Link>
        <div className="flex items-center gap-3"><Link to="/premium" className="hidden text-sm text-muted-foreground sm:block">Planos</Link><Link to="/auth" className="rounded-full bg-foreground px-5 py-2.5 text-sm text-primary-foreground">Entrar</Link></div>
      </nav>

      <section className="mx-auto grid min-h-[76vh] max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-2xl animate-fade-in-slow">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Inteligência para o seu armário</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-7xl">Escolha o que vestir com as roupas que você já tem.</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">Organize suas peças, receba combinações para cada ocasião e visualize o resultado no seu corpo.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/auth" className="press-gold inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm text-primary-foreground">Começar grátis <ArrowRight size={16} /></Link><Link to="/premium" className="rounded-full border border-border px-6 py-3.5 text-sm">Ver planos</Link></div>
          <p className="mt-4 text-xs text-muted-foreground">Plano Free com 3 gerações por dia. Não é preciso cartão.</p>
        </div>

        <div className="relative mx-auto w-full max-w-md border-y border-border py-6">
          <div className="grid grid-cols-3 gap-3">
            {["Camisa branca", "Calça alfaiataria", "Tênis claro"].map((name, index) => <div key={name} className="aspect-[3/4] bg-card p-3 shadow-soft"><div className="flex h-3/4 items-center justify-center bg-muted"><Shirt size={32} className="text-muted-foreground" strokeWidth={1.2} /></div><p className="mt-3 text-xs">{name}</p><p className="mt-1 text-[9px] uppercase text-muted-foreground">Detectado pela IA</p></div>)}
          </div>
          <div className="mt-4 flex items-center gap-3 border border-gold/30 bg-card p-4 shadow-lift"><Sparkles className="text-gold" /><div><p className="font-display text-xl">Look para o trabalho</p><p className="text-xs text-muted-foreground">Equilibrado, versátil e pronto com o que você já tem.</p></div></div>
        </div>
      </section>

      <section className="border-t border-border py-16"><div className="mx-auto max-w-6xl px-5"><p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Do armário à decisão</p><h2 className="mt-2 max-w-2xl font-display text-4xl">Sua primeira combinação em três passos.</h2><div className="mt-8 grid gap-8 md:grid-cols-3">{benefits.map(({ icon: Icon, title, text }, index) => <article key={title} className="border-t border-border pt-5"><span className="text-xs text-gold">0{index + 1}</span><Icon className="mt-5" strokeWidth={1.3} /><h3 className="mt-4 font-display text-2xl">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></article>)}</div></div></section>

      <section className="border-t border-border py-16"><div className="mx-auto max-w-3xl px-5 text-center"><h2 className="font-display text-4xl">Comece com o essencial.</h2><p className="mt-3 text-muted-foreground">Cadastre duas peças e peça sua primeira combinação. O Stylisme aprende com suas escolhas.</p><ul className="mx-auto mt-6 grid max-w-xl gap-2 text-left text-sm sm:grid-cols-2">{["Fundo removido automaticamente", "Detalhes identificados pela IA", "3 gerações grátis por dia", "Fotos privadas por padrão"].map((item) => <li key={item} className="flex items-center gap-2"><Check size={14} className="text-gold" /> {item}</li>)}</ul><Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm text-primary-foreground">Criar meu armário <ArrowRight size={16} /></Link></div></section>

      <footer className="border-t border-border py-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-muted-foreground"><span>© 2026 Stylisme</span><div className="flex gap-4"><Link to="/premium">Planos</Link><Link to="/privacidade">Privacidade</Link><Link to="/termos">Termos</Link></div></div></footer>
    </main>
  );
}