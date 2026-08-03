import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, HelpCircle, Mail, MessageSquare, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SUPPORT_EMAIL = "stylismeinteligencefyw@gmail.com";

const FAQS = [
  {
    question: "Como adicionar roupas no meu armário digital?",
    answer:
      "Na aba Armário, toque no botão '+' e envie uma foto da peça. O Stylisme usa IA para remover o fundo automaticamente e extrair cor, material e categoria — você pode ajustar tudo depois se quiser.",
  },
  {
    question: "Como funciona o Provador Virtual?",
    answer:
      "Envie uma foto de corpo inteiro na aba Looks e selecione as peças do seu armário. A IA posiciona e ajusta cada roupa sobre o seu corpo, respeitando caimento, sobreposição e proporções.",
  },
  {
    question: "O que é a Análise de Paleta de Cores?",
    answer:
      "Na aba Cores, envie uma foto do seu rosto. A IA identifica sua tonalidade, contraste e subtom para indicar a paleta ideal (primavera brilhante, inverno profundo etc.) e as cores que mais valorizam você.",
  },
  {
    question: "Como funciona o plano Premium?",
    answer:
      "O Premium remove limites de uso da IA, libera looks ilimitados, provador virtual avançado, estatísticas detalhadas e recomendações personalizadas. Você gerencia a assinatura em 'Minha assinatura'.",
  },
  {
    question: "Posso compartilhar meus looks?",
    answer:
      "Sim! Na tela de Looks, toque no botão de compartilhar. O Stylisme gera um card bonito com a foto do look, sua paleta e a marca, pronto para Stories ou mensagens.",
  },
];

export const Route = createFileRoute("/app/help")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda — Stylisme" },
      { name: "description", content: "Tire dúvidas e fale com o time do Stylisme." },
      { property: "og:title", content: "Central de Ajuda — Stylisme" },
      { property: "og:description", content: "Tire dúvidas e fale com o time do Stylisme." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/app/help" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/app/help" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `Nome: ${form.name}`,
      `Email: ${form.email}`,
      "",
      form.message,
    ].join("%0D%0A");
    window.open(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        `[Ajuda Stylisme] ${form.subject}`
      )}&body=${body}`,
      "_blank"
    );
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="px-5 pt-8">
      <Link
        to="/app/profile"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={18} strokeWidth={1.5} />
        Voltar
      </Link>

      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Suporte</p>
      <h1 className="font-display text-3xl">Central de Ajuda</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Encontre respostas rápidas ou fale direto com nosso time.
      </p>

      <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-soft">
        <Accordion type="single" collapsible className="px-5">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-sm">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <MessageSquare size={18} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-lg">Fale com a gente</p>
            <p className="text-xs text-muted-foreground">Respondemos em até 24h</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="help-name">Nome</Label>
            <Input
              id="help-name"
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="help-email">Email</Label>
            <Input
              id="help-email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="help-subject">Assunto</Label>
            <Input
              id="help-subject"
              placeholder="Ex: Problema no provador virtual"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="help-message">Mensagem</Label>
            <Textarea
              id="help-message"
              placeholder="Descreva o que aconteceu..."
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full">
            <Mail size={16} strokeWidth={1.5} /> Enviar por email
          </Button>
          {sent && (
            <p className="text-center text-xs text-muted-foreground">
              Abrindo o app de email com os dados preenchidos...
            </p>
          )}
        </form>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <HelpCircle size={14} strokeWidth={1.5} />
          {SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  );
}
