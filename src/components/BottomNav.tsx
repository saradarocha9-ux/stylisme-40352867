import { Link, useRouterState } from "@tanstack/react-router";
import { Shirt, UserSquare2, Wand2, Palette, User, Compass } from "lucide-react";
import { tap } from "@/lib/haptics";

const items = [
  { to: "/app", label: "Armário", icon: Shirt },
  { to: "/app/looks", label: "Provador", icon: UserSquare2 },
  { to: "/app/feed", label: "Feed", icon: Compass },
  { to: "/app/ai", label: "IA", icon: Wand2 },
  { to: "/app/palette", label: "Cores", icon: Palette },
  { to: "/app/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto max-w-md grid grid-cols-6">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== "/app" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => tap()}
              className="press-gold relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-[0.14em]"
            >
              <span
                className={
                  "absolute top-0 h-[2px] w-8 rounded-full bg-gold transition-all duration-500 " +
                  (active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0")
                }
              />
              <span
                className={
                  "absolute inset-x-3 inset-y-1.5 rounded-2xl bg-foreground/[0.06] transition-all duration-500 " +
                  (active ? "opacity-100 scale-100" : "opacity-0 scale-90")
                }
              />
              <Icon
                size={20}
                strokeWidth={1.5}
                className={
                  "relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                  (active ? "text-foreground -translate-y-0.5 scale-110 drop-shadow-[0_2px_8px_oklch(0.78_0.13_85/0.45)]" : "text-muted-foreground")
                }
              />
              <span className={"relative transition-colors duration-300 " + (active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>

  );
}
