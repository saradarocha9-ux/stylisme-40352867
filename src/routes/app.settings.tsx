import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { getMyProfile, saveProfile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";

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
  const [saving, setSaving] = useState(false);
  const deleteAccountNow = useServerFn(deleteMyAccount);

  useEffect(() => {
    let active = true;
    void Promise.all([getMyProfile(), supabase.auth.getUser()]).then(([profile, auth]) => {
      if (!active) return;
      setName(profile?.name || state.profile.name);
      setEmail(auth.data.user?.email ?? state.profile.email);
    });
    return () => { active = false; };
  }, [state.profile.email, state.profile.name]);

  async function save() {
    setSaving(true);
    try {
      await saveProfile({ name: name.trim() });
      actions.updateProfile({ name: name.trim(), email });
      toast.success("Nome salvo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePaletteHistory() {
    if (!confirm("Apagar todo o histórico de análises de cor?")) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase.from("color_analyses").delete().eq("user_id", data.user.id);
    if (error) toast.error("Não consegui apagar o histórico.");
    else toast.success("Histórico de cores apagado.");
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

  async function deleteAccount() {
    if (confirm("Excluir sua conta apagará todos os dados. Continuar?")) {
      try {
        await deleteAccountNow();
        actions.wipe();
        await supabase.auth.signOut();
        await navigate({ to: "/", replace: true });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível excluir sua conta.");
      }
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
        <Input label="Email da conta" value={email} onChange={setEmail} type="email" disabled />
        <p className="text-xs text-muted-foreground">O e-mail de acesso não pode ser alterado aqui.</p>
        <button onClick={() => void save()} disabled={saving} className="w-full rounded-full bg-foreground py-3 text-xs uppercase tracking-[0.24em] text-primary-foreground disabled:opacity-50">{saving ? "Salvando…" : "Salvar nome"}</button>
      </section>

      <section id="fotos" className="mt-4 space-y-3 rounded-3xl bg-card p-5 shadow-soft">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Minhas fotos</p>
        <p className="text-xs text-muted-foreground">Apague qualquer foto sem excluir sua conta.</p>
        <PhotoRow
          label="Foto do provador (corpo inteiro)"
          src={state.profile.bodyPhotoUrl}
          onDelete={() => { actions.updateProfile({ bodyPhotoUrl: undefined }); toast.success("Foto do provador apagada."); }}
        />
        <PhotoRow
          label="Foto de coloração (rosto)"
          src={state.profile.facePhotoUrl}
          onDelete={() => { actions.updateProfile({ facePhotoUrl: undefined }); toast.success("Foto de coloração apagada."); }}
        />
        <button
          onClick={() => void deletePaletteHistory()}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-left text-xs text-destructive"
        >
          Apagar histórico de análises de cor (miniaturas salvas na nuvem)
        </button>
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
        <Link to="/privacidade" className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-sm shadow-soft">
          <span className="flex items-center gap-2"><Shield size={16} strokeWidth={1.5} /> Política de Privacidade</span>
          <span className="text-muted-foreground">→</span>
        </Link>
        <button onClick={() => void deleteAccount()} className="w-full rounded-2xl bg-card p-4 text-left text-sm text-destructive shadow-soft">Excluir minha conta</button>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function PhotoRow({ label, src, onDelete }: { label: string; src?: string; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{label}</p>
        <p className="text-[11px] text-muted-foreground">{src ? "Salva só neste aparelho" : "Nenhuma foto enviada"}</p>
      </div>
      <button
        onClick={() => { if (confirm(`Apagar ${label.toLowerCase()}?`)) onDelete(); }}
        disabled={!src}
        className="rounded-full border border-border px-3 py-1.5 text-xs text-destructive disabled:opacity-40"
      >Apagar</button>
    </div>
  );
}
