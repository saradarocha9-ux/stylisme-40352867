import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1200);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => navigate({ to: "/app" }), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="animate-logo-in">
        <Logo size={140} />
      </div>
      {phase >= 1 && (
        <h1 className="mt-2 font-display text-5xl tracking-[0.02em] text-foreground animate-fade-in-slow">
          Stylisme
        </h1>
      )}
      {phase >= 2 && (
        <p className="mt-4 text-sm uppercase tracking-[0.32em] text-muted-foreground animate-fade-in-slow">
          Inteligência para o seu armário
        </p>
      )}
    </div>
  );
}
