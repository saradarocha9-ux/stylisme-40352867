import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Crown, Settings, LogOut, ChevronRight, User as UserIcon, CreditCard, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);
  const p = state.profile;
  const days = Math.max(1, Math.floor((Date.now() - p.joinedAt) / 86400000));
  const favCount = state.garments.filter((g) => g.favorite).length + state.looks.filter((l) => l.favorite).length;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }


  return (
    <div className="px-5 pt-8">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Você</p>
      <h1 className="font-display text-3xl">Perfil</h1>

      <div className="mt-6 flex items-center gap-4 rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-muted">
          {p.photoUrl ? <img src={p.photoUrl} alt="" className="h-full w-full object-cover" /> : <UserIcon size={26} className="text-muted-foreground" strokeWidth={1.5} />}
        </div>
        <div className="flex-1">
          <p className="font-display text-xl">{p.name}</p>
          <p className="text-xs text-muted-foreground">{email || "sem email"}</p>
          <div className={"mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] " + (p.plan === "premium" ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground")}>
            <Crown size={10} /> {p.plan === "premium" ? "Premium" : "Free"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="Roupas" value={state.garments.length} />
        <Stat label="Looks" value={state.looks.length} />
        <Stat label="Favoritos" value={favCount} />
        <Stat label="Dias" value={days} />
      </div>

      {p.plan === "free" && (
        <Link to="/app/premium" className="mt-6 flex items-center justify-between rounded-3xl bg-premium p-5 text-white shadow-lift">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] opacity-70">Plano atual · Free</p>
            <p className="font-display text-xl">Conheça o Stylisme Premium</p>
          </div>
          <Crown className="text-gold" />
        </Link>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-soft">
        <Row to="/app/subscription" icon={CreditCard} label="Minha assinatura" />
        <Row to="/app/stats" icon={BarChart3} label="Estatísticas" />
        <Row to="/app/settings" icon={Settings} label="Configurações" />
        <Row onClick={signOut} icon={LogOut} label="Sair" danger />
      </div>
    </div>
  );
}

function Row({ to, onClick, icon: Icon, label, danger }: { to?: string; onClick?: () => void; icon: React.ElementType; label: string; danger?: boolean }) {
  const cls = "flex w-full items-center justify-between border-b border-border px-5 py-4 last:border-b-0 text-left " + (danger ? "text-destructive" : "");
  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={1.5} />
        <span className="text-sm">{label}</span>
      </div>
      <ChevronRight size={16} className="text-muted-foreground" />
    </>
  );
  if (to) return <Link to={to} className={cls}>{content}</Link>;
  return <button onClick={onClick} className={cls}>{content}</button>;
}


function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-soft">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ to, icon: Icon, label, danger }: { to: string; icon: React.ElementType; label: string; danger?: boolean }) {
  return (
    <Link to={to} className={"flex items-center justify-between border-b border-border px-5 py-4 last:border-b-0 " + (danger ? "text-destructive" : "")}>
      <div className="flex items-center gap-3">
        <Icon size={18} strokeWidth={1.5} />
        <span className="text-sm">{label}</span>
      </div>
      <ChevronRight size={16} className="text-muted-foreground" />
    </Link>
  );
}
