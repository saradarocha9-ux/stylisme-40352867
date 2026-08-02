import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lightbulb, Mail, Sparkles, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SUPPORT_EMAIL = "stylismeinteligencefyw@gmail.com";

export const Route = createFileRoute("/app/ideas")({
  head: () => ({
    meta: [
      { title: "Central de Ideias — Stylisme" },
      { name: "description", content: "Sugira melhorias e novas funcionalidades para o Stylisme." },
      { property: "og:title", content: "Central de Ideias — Stylisme" },
      { property: "og:description", content: "Sugira melhorias e novas funcionalidades para o Stylisme." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/app/ideas" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/app/ideas" }],
  }),
  component: IdeasPage,
});

function IdeasPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [
      `Nome: ${form.name}`,
      `Email: ${form.email}`,
      "",
      `Ideia: ${form.title}`,
      "",
      form.description,
    ].join("%0D%0A");
    window.open(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        `[Ideia Stylisme] ${form.title}`
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

      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Você</p>
      <h1 className="font-display text-3xl">Central de Ideias</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua sugestão pode virar a próxima funcionalidade do Stylisme.
      </p>

      <div className="mt-6 rounded-3xl bg-gradient-to-br from-card to-muted/40 p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
            <Sparkles size={18} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-lg">Envie sua ideia</p>
            <p className="text-xs text-muted-foreground">Curta, mas com contexto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="idea-name">Nome</Label>
            <Input
              id="idea-name"
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idea-email">Email</Label>
            <Input
              id="idea-email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idea-title">Título da ideia</Label>
            <Input
              id="idea-title"
              placeholder="Ex: Look do dia com base no clima"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idea-description">Descreva sua ideia</Label>
            <Textarea
              id="idea-description"
              placeholder="Como funcionaria, por que é útil, onde apareceria no app..."
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full bg-gold text-gold-foreground hover:bg-gold/90">
            <Send size={16} strokeWidth={1.5} /> Enviar ideia
          </Button>
          {sent && (
            <p className="text-center text-xs text-muted-foreground">
              Abrindo o app de email com sua ideia...
            </p>
          )}
        </form>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <Mail size={14} strokeWidth={1.5} />
          {SUPPORT_EMAIL}
        </a>
      </div>

      <div className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Lightbulb size={18} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-lg">Boa ideia = boa recompensa</p>
            <p className="text-xs text-muted-foreground">
              Ideias implementadas ganham destaque no app e créditos especiais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
