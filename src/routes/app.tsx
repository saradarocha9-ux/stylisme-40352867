import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useSession } from "@/hooks/use-session";
import { Logo } from "@/components/Logo";
import { SponsoredAd } from "@/components/SponsoredAd";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Aplicativo — Stylisme" },
      { name: "description", content: "Organize seu armário e escolha o que vestir com o Stylisme." },
      { property: "og:title", content: "Aplicativo — Stylisme" },
      { property: "og:description", content: "Organize seu armário e escolha o que vestir com o Stylisme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppLayout,
});

/** Cada rota do app tem o seu placement (e, por consequência, o seu bloco AdSense). */
const PLACEMENTS: Record<string, string> = {
  "/app": "app-armario",
  "/app/looks": "app-looks",
  "/app/feed": "app-feed",

  "/app/ai": "app-ai",
  "/app/palette": "app-palette",
  "/app/favorites": "app-favorites",
  "/app/stats": "app-stats",
  "/app/profile": "app-profile",
};


function AppLayout() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const redirectingRef = useRef(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const placement = PLACEMENTS[pathname.replace(/(.)\/$/, "$1")] ?? "app-corner";

  useEffect(() => {
    if (loading || session || redirectingRef.current) return;
    redirectingRef.current = true;
    void navigate({ to: "/auth", replace: true }).catch(() => {
      redirectingRef.current = false;
    });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-logo-in opacity-70">
          <Logo size={72} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div key={pathname} className="animate-page mx-auto w-full max-w-md pb-28 lg:max-w-6xl">
        <Outlet />
      </div>
      <BottomNav />
      <SponsoredAd key={placement} placement={placement} />
    </div>
  );
}

