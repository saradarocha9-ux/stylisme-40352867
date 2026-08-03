import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";

const TITLE = "Política de Privacidade";
const DESC = "Saiba como o Stylisme coleta, usa e protege seus dados pessoais e de estilo.";
const URL = "https://stylisme.company/privacidade";

export const Route = createFileRoute("/privacidade")({
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
  component: PrivacyPage,
});

function PrivacyPage() {
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
          <Shield size={22} strokeWidth={1.5} className="text-gold" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Legal</p>
          <h1 className="font-display text-3xl">{TITLE}</h1>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Esta página é mantida pela equipe do Stylisme para explicar, de forma simples, como tratamos os dados que você
        compartilha com a gente. Ao usar o Stylisme, você confirma que leu e concorda com as práticas descritas aqui.
      </p>

      <div className="mt-8 space-y-6">
        <Section title="1. Quem somos">
          <p>
            O Stylisme é um app de guarda-roupa digital com inteligência artificial. Nossa missão é ajudar você a
            organizar suas roupas, montar looks, experimentar peças virtualmente e descobrir a paleta de cores que mais
            valoriza você.
          </p>
          <p>
            Dúvidas sobre esta política podem ser enviadas para{" "}
            <a href="mailto:stylismeinteligencefyw@gmail.com" className="underline">
              stylismeinteligencefyw@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. O que coletamos">
          <p>Coletamos apenas o necessário para o app funcionar:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Dados de conta:</strong> nome, email e identificador fornecidos pelo login com Google (autenticação via Lovable Cloud).
            </li>
            <li>
              <strong>Fotos de roupas:</strong> imagens que você envia para cadastrar peças no armário digital.
            </li>
            <li>
              <strong>Foto do corpo:</strong> imagem que você envia para o provador virtual; usada apenas para gerar a visualização do look.
            </li>
            <li>
              <strong>Foto do rosto:</strong> imagem usada na análise de coloração pessoal e paleta de cores.
            </li>
            <li>
              <strong>Dados de uso:</strong> quantidade de roupas, looks, favoritos e interações no feed (curtidas, compartilhamentos).
            </li>
            <li>
              <strong>Informações de assinatura:</strong> status Premium (free ou premium) e dados de pagamento gerenciados pelo Stripe.
            </li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
        <ul className="list-disc space-y-1.5 pl-5">
            <li>Para remover o fundo das roupas e identificar cor, material e categoria automaticamente.</li>
            <li>Para posicionar peças sobre a foto do corpo no provador virtual.</li>
            <li>Para analisar sua coloração pessoal e gerar recomendações de cores e looks.</li>
            <li>Para sincronizar seu armário, looks e perfil entre dispositivos.</li>
            <li>Para exibir looks publicados no feed da comunidade, quando você escolher compartilhar.</li>
            <li>Para gerenciar seu plano Free ou Premium e processar pagamentos via Stripe.</li>
          </ul>
        </Section>

        <Section title="4. Compartilhamento com terceiros">
          <p>
            Não vendemos seus dados. Usamos serviços selecionados para processar partes específicas do app, sempre com
            proteções contratuais:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Lovable Cloud</strong> — hospeda a autenticação, banco de dados e storage do app.
            </li>
            <li>
              <strong>Google AI (Gemini)</strong> — processa imagens e gera análises de roupas, looks, provador virtual e coloração pessoal.
            </li>
            <li>
              <strong>remove.bg</strong> — usada como uma das opções para remover o fundo de imagens de roupas.
            </li>
            <li>
              <strong>Stripe</strong> — processa pagamentos e assinaturas Premium.
            </li>
            <li>
              <strong>Google AdSense / AdMob</strong> — exibe anúncios discretos de moda no app. Os anúncios são fornecidos por redes parceiras e respeitam as configurações do seu dispositivo.
            </li>
          </ul>
        </Section>

        <Section title="5. Armazenamento e segurança">
          <p>
            Seus dados são armazenados no backend do app (Lovable Cloud) com criptografia em trânsito e autenticação por
            sessão. Cada usuário acessa apenas seus próprios dados, exceto quando decide publicar um look no feed da
            comunidade.
          </p>
          <p>
            Embora adotemos boas práticas de segurança, nenhum sistema é 100% invulnerável. Por isso, não envie senhas,
            documentos oficiais ou informações financeiras diretamente pelo app.
          </p>
        </Section>

        <Section title="6. Seus direitos">
          <p>Você pode:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Exportar seus dados em Configurações → Exportar meus dados.</li>
            <li>Excluir sua conta e todos os dados associados em Configurações → Excluir minha conta.</li>
            <li>Deixar de publicar looks no feed a qualquer momento.</li>
            <li>Entrar em contato pelo email acima para dúvidas, correções ou revogação de consentimento.</li>
          </ul>
        </Section>

        <Section title="7. Retenção de dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir a conta, os dados são removidos do
            banco ativo em até 30 dias. Backups automáticos podem reter cópias por mais tempo, mas de forma criptografada
            e isolada.
          </p>
        </Section>

        <Section title="8. Crianças e adolescentes">
          <p>
            O Stylisme é destinado a maiores de 13 anos. Se identificarmos uma conta de menor de idade, podemos
            suspendê-la e remover os dados.
          </p>
        </Section>

        <Section title="9. Alterações nesta política">
          <p>
            Podemos atualizar esta política para refletir novos recursos ou obrigações legais. A data da última versão
            aparece no final desta página. Mudanças significativas serão comunicadas dentro do app ou por email.
          </p>
        </Section>

        <Section title="10. Responsabilidade compartilhada">
          <p>
            O Stylisme roda sobre a plataforma Lovable Cloud, que fornece autenticação, banco de dados e storage. A
            segurança do app também depende de você: mantenha seu dispositivo protegido, não compartilhe sua conta e
            revise cuidadosamente as permissões concedidas ao login com Google.
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
        Última atualização: 3 de agosto de 2026.
      </p>
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
