import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

const TITLE = "Melhores apps de guarda-roupa digital em 2026";
const DESC =
  "Comparativo dos melhores apps de armário digital — Stylisme, Whering, Stylebook e Acloset — com recursos de IA, provador virtual e cartela de cores.";
const URL = "https://stylisme.company/guia/melhores-apps-de-guarda-roupa";

export const Route = createFileRoute("/guia/melhores-apps-de-guarda-roupa")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Stylisme` },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESC,
          author: { "@type": "Organization", name: "Stylisme" },
          publisher: { "@type": "Organization", name: "Stylisme" },
          mainEntityOfPage: URL,
        }),
      },
    ],
  }),
  component: GuidePage,
});

const APPS = [
  {
    name: "Stylisme",
    strong: "IA de verdade: análise automática das peças, provador generativo e cartela de cores pessoal.",
    fit: "Quem quer montar looks reais com as próprias roupas, sem trabalho manual.",
  },
  {
    name: "Whering",
    strong: "Comunidade grande e foco em moda circular (troca e revenda de peças).",
    fit: "Quem gosta do lado social e sustentável do armário digital.",
  },
  {
    name: "Stylebook",
    strong: "Controle detalhado: estatísticas de uso, calendário e custo por uso.",
    fit: "Quem quer planilhar o guarda-roupa e não se importa em cadastrar tudo à mão.",
  },
  {
    name: "Acloset",
    strong: "Cadastro rápido com remoção de fundo e sugestões básicas por ocasião.",
    fit: "Quem só quer catalogar peças de forma simples.",
  },
];

function GuidePage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-10">
      <Link to="/" className="inline-flex items-center gap-2">
        <Logo size={32} />
        <span className="font-display text-xl">Stylisme</span>
      </Link>

      <p className="mt-8 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Guia</p>
      <h1 className="mt-1 font-display text-4xl leading-tight">{TITLE}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Um app de guarda-roupa digital serve para fotografar suas roupas, organizá-las por
        categoria e montar looks sem revirar o armário. Abaixo, como os principais apps se
        comparam e o que muda quando a inteligência artificial entra no processo.
      </p>

      <h2 className="mt-10 font-display text-2xl">Comparativo rápido</h2>
      <ul className="mt-4 space-y-4">
        {APPS.map((a) => (
          <li key={a.name} className="rounded-3xl bg-card p-5 shadow-soft">
            <h3 className="font-display text-xl">{a.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong className="text-foreground">Ponto forte:</strong> {a.strong}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong className="text-foreground">Ideal para:</strong> {a.fit}
            </p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl">O que avaliar antes de escolher</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Cadastro das peças: a remoção de fundo é automática ou manual?</li>
        <li>Qualidade das sugestões: o app entende tecido, formalidade e estação?</li>
        <li>Provador virtual: dá para ver a peça no seu corpo, e não só num manequim?</li>
        <li>Cores: existe análise de coloração pessoal para acertar o que combina com você?</li>
        <li>Estatísticas: quais peças você realmente usa e quais estão paradas?</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl">Por que o Stylisme se destaca</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        No Stylisme, ao cadastrar uma peça a IA identifica categoria, cor e material sozinha,
        e o fundo é removido na hora. Na aba de looks, a IA sugere três combinações coerentes
        (nada de renda com jaqueta de couro), e o provador generativo veste as peças no seu
        corpo respeitando caimento e camadas. A análise de coloração pessoal ainda indica quais
        cores valorizam você — e cruza isso com o que já está no seu armário.
      </p>

      <div className="mt-10 rounded-3xl bg-card p-6 text-center shadow-soft">
        <h2 className="font-display text-2xl">Experimente o Stylisme</h2>
        <p className="mt-2 text-sm text-muted-foreground">Inteligência para o seu armário.</p>
        <Link
          to="/auth"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground"
        >
          Começar agora
        </Link>
      </div>
    </main>
  );
}
