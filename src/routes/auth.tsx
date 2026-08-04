import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/Logo";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Stylisme" },
      { name: "description", content: "Acesse sua conta Stylisme para abrir seu guarda-roupa digital, seus looks e sua cartela de cores." },
      { property: "og:title", content: "Entrar — Stylisme" },
      { property: "og:description", content: "Acesse sua conta Stylisme para abrir seu guarda-roupa digital, seus looks e sua cartela de cores." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/auth" },
      { property: "og:image", content: "https://stylisme.company/og-stylisme.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://stylisme.company/og-stylisme.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/auth" }],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, go straight to the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/app" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href,
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: new URL(import.meta.env.BASE_URL, window.location.origin).href,
    });
    if (result.error) setError("Não foi possível entrar com o Google.");
  }

  return (
    <div className="min-h-screen bg-background px-6 pb-16 pt-14">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center animate-fade-in-slow">
        <Logo size={72} />
        <h1 className="mt-4 font-display text-4xl">Stylisme</h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Inteligência para o seu armário
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-sm">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          <button
            onClick={() => setMode("signin")}
            className={"rounded-full py-2 text-xs uppercase tracking-[0.2em] " + (mode === "signin" ? "bg-background shadow-soft" : "text-muted-foreground")}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("signup")}
            className={"rounded-full py-2 text-xs uppercase tracking-[0.2em] " + (mode === "signup" ? "bg-background shadow-soft" : "text-muted-foreground")}
          >
            Criar conta
          </button>
        </div>

        <button
          onClick={google}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-card py-3.5 text-sm shadow-soft transition hover:border-foreground"
        >
          <GoogleIcon /> Continuar com Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou com email <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field icon={User} placeholder="Seu nome" value={name} onChange={setName} />
          )}
          <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required />
          <Field icon={Lock} type="password" placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={setPassword} minLength={6} required />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm uppercase tracking-[0.24em] text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {mode === "signup" && (
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Ao criar sua conta, você começa no plano <span className="text-foreground">Stylisme Free</span>.
          </p>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Voltar</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, value, onChange, type = "text", placeholder, required, minLength,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft focus-within:border-foreground">
      <Icon size={16} className="text-muted-foreground" strokeWidth={1.5} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.3 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.3 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.4 34.9 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C41 35.9 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
