import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { actions, useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Stylisme" },
      { name: "description", content: "Ajuste tema, notificações e preferências do seu Stylisme." },
      { property: "og:title", content: "Configurações — Stylisme" },
      { property: "og:description", content: "Ajuste tema, notificações e preferências do seu Stylisme." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://stylisme.company/app/settings" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://stylisme.company/app/settings" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(state.profile.name);
  const [email, setEmail] = useState(state.profile.email);

  function save() {
    actions.updateProfile({ name, email });
    alert("Dados salvos.");
  }

  function pickTheme(t: "light" | "dark") {
    setTheme(t);
    actions.updateProfile({ theme: t });
  }

  function exportData() {
    const blob = new Blob([actions.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "stylisme-backup.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function deleteAccount() {
    if (confirm("Excluir sua conta apagará todos os dados. Continuar?")) {
      actions.wipe();
      navigate({ to: "/" });
    }
  }

  return (
    <div className="px-5 pt-8">
      <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="mt-4 font-display text-3xl">Configurações</h1>

      <section className="mt-6 space-y-3 rounded-3xl bg-card p-5 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Perfil</p>
        <Input label="Nome" value={name} onChange={setName} />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <button onClick={save} className="w-full rounded-full bg-foreground py-3 text-xs uppercase tracking-[0.24em] text-primary-foreground">Salvar</button>
      </section>

      <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Tema</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["dark", "light"] as const).map((t) => (
            <button key={t} onClick={() => pickTheme(t)} className={"rounded-full border py-2 text-xs " + (theme === t ? "border-foreground bg-foreground text-primary-foreground" : "border-border")}>
              {t === "dark" ? "Preto" : "Branco"}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-card p-5 shadow-soft">
        <label className="flex items-center justify-between text-sm">
          <span>Notificações</span>
          <input
            type="checkbox"
            checked={state.profile.notifications}
            onChange={(e) => actions.updateProfile({ notifications: e.target.checked })}
          />
        </label>
      </section>

      <section className="mt-4 space-y-2">
        <button onClick={exportData} className="w-full rounded-2xl bg-card p-4 text-left text-sm shadow-soft">Exportar meus dados</button>
        <button onClick={deleteAccount} className="w-full rounded-2xl bg-card p-4 text-left text-sm text-destructive shadow-soft">Excluir minha conta</button>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
