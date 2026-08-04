import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { useSession } from "@/hooks/use-session";
import { Logo } from "@/components/Logo";
import { SponsoredAd } from "@/components/SponsoredAd";

export const Route = createFileRoute("/app")({
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
  const { loading } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const placement = PLACEMENTS[pathname.replace(/(.)\/$/, "$1")] ?? "app-corner";

  if (loading) {
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
      <div key={pathname} className="animate-page mx-auto max-w-md pb-28">
        <Outlet />
      </div>
      <BottomNav />
      <SponsoredAd key={placement} placement={placement} />
    </div>
  );
}

