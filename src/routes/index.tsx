import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stylisme — Inteligência para o seu armário" },
      {
        name: "description",
        content:
          "Guarda-roupa digital com IA: monte looks, descubra sua cartela de cores e experimente peças no provador virtual.",
      },
      { property: "og:title", content: "Stylisme — Inteligência para o seu armário" },
      {
        property: "og:description",
        content: "Guarda-roupa digital, provador virtual, looks com IA e cartela de cores personalizada.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/" },
      { property: "og:image", content: "https://stylisme.company/og-stylisme.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://stylisme.company/og-stylisme.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/" }],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        void navigate({
          to: data.session ? "/app" : "/auth",
          replace: true,
        });
      });
    }, 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 text-center">
      <div className="aurora pointer-events-none absolute inset-0 opacity-25" />
      <div className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="animate-logo-in">
          <Logo size={140} />
        </div>
        <h1
          className="mt-2 animate-fade-in-slow font-display text-5xl tracking-[0.02em] text-foreground"
          style={{ animationDelay: "1s" }}
        >
          Stylisme
        </h1>
        <p
          className="mt-4 animate-fade-in-slow text-sm uppercase tracking-[0.32em] text-muted-foreground"
          style={{ animationDelay: "1.9s" }}
        >
          Inteligência para o seu armário
        </p>
        <div
          className="mt-10 h-px w-24 animate-fade-in-slow bg-gold opacity-70"
          style={{ animationDelay: "2.4s" }}
        />
      </div>
    </div>
  );
}

