import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — Stylisme" }, { name: "description", content: "Crie uma nova senha para sua conta Stylisme." }, { property: "og:title", content: "Redefinir senha — Stylisme" }, { property: "og:description", content: "Crie uma nova senha para sua conta Stylisme." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    void navigate({ to: "/app", replace: true });
  }
  return <main className="flex min-h-screen items-center justify-center bg-background px-5"><form onSubmit={submit} className="w-full max-w-sm"><Logo size={56} /><h1 className="mt-5 font-display text-4xl">Crie uma nova senha</h1><p className="mt-2 text-sm text-muted-foreground">Use pelo menos 6 caracteres.</p><label className="mt-6 block"><span className="mb-2 block text-xs text-muted-foreground">Nova senha</span><span className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"><Lock size={16} /><input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-sm outline-none" /></span></label>{error && <p className="mt-3 text-xs text-destructive">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-full bg-foreground py-3.5 text-sm text-primary-foreground">{loading ? "Salvando…" : "Salvar nova senha"}</button><Link to="/auth" className="mt-5 block text-center text-xs text-muted-foreground">Voltar ao acesso</Link></form></main>;
}