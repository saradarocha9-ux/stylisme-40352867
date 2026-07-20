import { Link, useRouterState } from "@tanstack/react-router";
import { Shirt, UserSquare2, Wand2, Heart, User } from "lucide-react";

const items = [
  { to: "/app", label: "Armário", icon: Shirt },
  { to: "/app/looks", label: "Provador", icon: UserSquare2 },
  { to: "/app/ai", label: "IA", icon: Wand2 },
  { to: "/app/favorites", label: "Favoritos", icon: Heart },
  { to: "/app/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-md grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== "/app" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-[0.14em]"
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                className={active ? "text-foreground" : "text-muted-foreground"}
              />
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
