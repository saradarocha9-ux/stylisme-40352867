import { createFileRoute, Navigate } from "@tanstack/react-router";
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
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    return { session: data.session };
  },
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session } = Route.useRouteContext();
  return (
    <>
      <Navigate to={session ? "/app" : "/auth"} />
      <div className="min-h-screen bg-background" />
    </>
  );
}

