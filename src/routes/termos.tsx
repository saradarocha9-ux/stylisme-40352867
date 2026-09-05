import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Scale } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SponsoredAd } from "@/components/SponsoredAd";

const TITLE = "Termos de Serviço";
const DESC = "Leia as regras de uso do Stylisme, planos, pagamentos e responsabilidades.";
const URL = "https://stylisme.company/termos";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: `${TITLE} — Stylisme` },
      { name: "description", content: DESC },
      { property: "og:title", content: `${TITLE} — Stylisme` },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 pb-24 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/app/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft size={18} strokeWidth={1.5} />
          Voltar
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-soft">
          <Scale size={22} strokeWidth={1.5} className="text-gold" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Legal</p>
          <h1 className="font-display text-3xl">{TITLE}</h1>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Estes Termos de Serviço regem o uso do Stylisme. Ao criar uma conta ou usar o app, você aceita as regras e
        condições descritas aqui. Se não concordar, não utilize o serviço.
      </p>

      <div className="mt-8 space-y-6">
        <Section title="1. Aceitação dos termos">
          <p>
            Ao acessar ou usar o Stylisme, você concorda com estes Termos de Serviço e com nossa{" "}
            <Link to="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            . Os termos podem ser atualizados a qualquer momento; mudanças significativas serão comunicadas no app ou
            por email.
          </p>
        </Section>

        <Section title="2. Descrição do serviço">
          <p>
            O Stylisme é um app de guarda-roupa digital com inteligência artificial. Nossa missão é ajudar você a
            organizar suas roupas, montar looks, experimentar peças virtualmente e descobrir a paleta de cores que mais
            valoriza você.
          </p>
          <p>
            Funcionalidades incluem cadastro de peças, remoção automática de fundo, montagem de looks com IA, provador
            virtual, análise de coloração pessoal, feed da comunidade e assinatura Premium.
          </p>
        </Section>

        <Section title="3. Conta e autenticação">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Você precisa ter pelo menos 13 anos para usar o Stylisme.</li>
            <li>
              A autenticação é feita pelo login com Google, gerenciado pela Lovable Cloud. Você é responsável por manter
              seu dispositivo e conta seguros.
            </li>
            <li>Não compartilhe sua conta com terceiros nem use contas falsas.</li>
            <li>
              Podemos suspender ou encerrar contas que violem estes termos, pratiquem fraude ou usem o app de forma
              abusiva.
            </li>
          </ul>
        </Section>

        <Section title="4. Planos, pagamentos e renovação">
          <p>
            O Stylisme oferece um plano gratuito com limites de uso e um plano Premium com recursos adicionais,
            cobrado recorrentemente via Stripe.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Os valores e benefícios do Premium estão descritos na tela de assinatura.</li>
            <li>A assinatura é renovada automaticamente até você cancelar.</li>
            <li>Cancele a qualquer momento nas configurações da loja de aplicativos ou pelo Stripe Customer Portal.</li>
            <li>Não reembolsamos pagamentos já processados, salvo exigência legal.</li>
          </ul>
        </Section>

        <Section title="5. Conteúdo do usuário">
          <p>Você mantém os direitos sobre as fotos e looks que cria. Ao publicar no feed da comunidade:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Você nos concede uma licença não exclusiva para exibir o conteúdo dentro do app.</li>
            <li>Não publique conteúdo ofensivo, ilegal, sexual, violento ou que viole direitos de terceiros.</li>
            <li>Podemos remover conteúdo ou contas que desrespeitem estas regras.</li>
          </ul>
        </Section>

        <Section title="6. Propriedade intelectual">
          <p>
            O nome Stylisme, logotipo, layout, código, modelos de IA e demais materiais do app são de nossa propriedade
            ou licenciados para uso. Você não pode copiar, modificar, distribuir ou criar produtos derivados sem
            autorização prévia.
          </p>
        </Section>

        <Section title="7. Conduta proibida">
          <p>É proibido:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Usar o app para fins ilegais ou não autorizados.</li>
            <li>Tentar acessar dados de outros usuários sem permissão.</li>
            <li>Enganar a IA com imagens manipuladas de forma maliciosa.</li>
            <li>Realizar engenharia reversa, scraping ou ataques ao serviço.</li>
            <li>Publicar spam, propagandas não autorizadas ou conteúdo de baixa qualidade em massa.</li>
          </ul>
        </Section>

        <Section title="8. Limitação de responsabilidade">
          <p>
            O Stylisme é fornecido "como está". Fazemos o possível para manter o serviço disponível e preciso, mas não
            garantimos resultados perfeitos da IA nem ausência total de falhas.
          </p>
          <p>
            Não nos responsabilizamos por danos indiretos, lucros cessantes ou decisões de compra baseadas nas
            recomendações do app. O uso do provador virtual e das sugestões de looks é uma orientação visual, não uma
            prova real de caimento ou cor exata.
          </p>
        </Section>

        <Section title="9. Anúncios e afiliados">
          <p>
            O app pode exibir anúncios discretos de moda e parceiros. Anunciantes e redes de publicidade podem usar
            identificadores anonimizados do dispositivo para entrega de anúncios, conforme configurado nas políticas de
            privacidade de cada rede.
          </p>
          <p>A assinatura Premium remove os anúncios dentro do app.</p>
        </Section>

        <Section title="10. Disponibilidade e modificações">
          <p>
            Podemos atualizar, interromper ou remover funcionalidades a qualquer momento, com aviso prévio quando
            possível. Também podemos limitar o uso gratuito caso identifiquemos abuso ou altos custos de infraestrutura.
          </p>
        </Section>

        <Section title="11. Rescisão">
          <p>
            Você pode excluir sua conta a qualquer momento em Configurações → Excluir minha conta. A exclusão remove seus
            dados do banco ativo em até 30 dias, salvo obrigações legais de retenção.
          </p>
          <p>
            Podemos suspender ou encerrar seu acesso se você violar estes termos, sem direito a reembolso em caso de
            assinatura ativa.
          </p>
        </Section>

        <Section title="12. Lei aplicável">
          <p>
            Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida no
            foro do domicílio do usuário, conforme permitido pela legislação brasileira.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{" "}
            <a href="mailto:stylismeinteligencefyw@gmail.com" className="underline">
              stylismeinteligencefyw@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3 rounded-3xl bg-card p-6 shadow-soft">
        <Logo size={40} />
        <div className="text-center">
          <p className="font-display text-lg">Stylisme</p>
          <p className="text-xs text-muted-foreground">Inteligência para o seu armário</p>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Última atualização: 5 de setembro de 2026.
      </p>
      <SponsoredAd placement="privacy" className="pb-6" />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-soft">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
