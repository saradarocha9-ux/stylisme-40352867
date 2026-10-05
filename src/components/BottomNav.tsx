import { Link, useRouterState } from "@tanstack/react-router";
import { Shirt, UserSquare2, Wand2, Palette, User, Compass, LayoutDashboard, Store } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { isOfficialUser } from "@/lib/official";
import { tap } from "@/lib/haptics";

const items = [
  { to: "/app", label: "Armário", icon: Shirt },
  { to: "/app/looks", label: "Provador", icon: UserSquare2 },
  { to: "/app/feed", label: "Inspire-se", icon: Compass },
  { to: "/app/partners", label: "Lojas", icon: Store },
  { to: "/app/ai", label: "IA", icon: Wand2 },
  { to: "/app/palette", label: "Cores", icon: Palette },
  { to: "/app/profile", label: "Perfil", icon: User },
] as const;

const officialItems = [
  { to: "/app/admin", label: "Painel", icon: LayoutDashboard },
  { to: "/app/feed", label: "Inspire-se", icon: Compass },
  { to: "/app/profile", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  const { session } = useSession();
  const official = isOfficialUser(session?.user.id, session?.user.email);
  const list: readonly { to: string; label: string; icon: typeof User }[] = official ? officialItems : items;
  return (
    <nav aria-label="Navegação principal" className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/70 backdrop-blur-2xl">
      <div className={"mx-auto grid max-w-md items-center gap-1 px-1 py-1.5 sm:gap-2 sm:px-3 lg:max-w-3xl " + (official ? "grid-cols-3" : "grid-cols-7")}>
        {list.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== "/app" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to as "/app"}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              onClick={() => tap()}
              className="press-gold relative flex h-14 min-w-0 flex-col items-center justify-center gap-2 text-[9px] tracking-normal sm:text-[10px]"
            >
              <span
                className={
                  "absolute top-0 h-[2px] w-8 rounded-full bg-gold transition-all duration-500 " +
                  (active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0")
                }
              />
              <span
                className={
                  "absolute inset-x-0.5 inset-y-0.5 rounded-lg bg-foreground/[0.06] transition-all duration-500 " +
                  (active ? "opacity-100 scale-100" : "opacity-0 scale-90")
                }
              />
              <Icon
                size={20}
                strokeWidth={1.5}
                className={
                  "relative transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                   (active ? "text-foreground -translate-y-0.5 scale-110" : "text-muted-foreground")
                }
              />
              <span className={"relative whitespace-nowrap leading-none transition-colors duration-300 " + (active || official ? "text-foreground" : "sr-only sm:not-sr-only sm:text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>

  );
}
