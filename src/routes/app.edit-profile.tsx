import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, ImagePlus, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { getMyProfile, saveProfile, uploadProfileImage, type CloudProfile } from "@/lib/profile";
import { resizeDataUrl } from "@/lib/image-resize";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/app/edit-profile")({
  head: () => ({
    meta: [
      { title: "Editar perfil — Stylisme" },
      { name: "description", content: "Personalize seu perfil Stylisme: foto, capa, nome de exibição, apelido e bio." },
      { property: "og:title", content: "Editar perfil — Stylisme" },
      { property: "og:description", content: "Personalize seu perfil Stylisme: foto, capa, nome de exibição, apelido e bio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditProfilePage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error("Não consegui ler a imagem."));
    fr.readAsDataURL(file);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

function EditProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CloudProfile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<Blob | null>(null);
  const [bannerFile, setBannerFile] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const p = await getMyProfile();
        if (!alive || !p) return;
        setProfile(p);
        setName(p.name);
        setUsername(p.username);
        setBio(p.bio);
        setLink(p.link);
        setAvatarPreview(p.avatarUrl);
        setBannerPreview(p.bannerUrl);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não consegui carregar seu perfil.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function pick(e: React.ChangeEvent<HTMLInputElement>, kind: "avatar" | "banner") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const raw = await fileToDataUrl(file);
      const resized = await resizeDataUrl(raw, kind === "avatar" ? 512 : 1280);
      const blob = await dataUrlToBlob(resized);
      if (kind === "avatar") { setAvatarPreview(resized); setAvatarFile(blob); }
      else { setBannerPreview(resized); setBannerFile(blob); }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Imagem inválida.");
    }
  }

  async function submit() {
    if (!name.trim()) return toast.error("Escolha um nome de exibição.");
    setSaving(true);
    try {
      const patch: Parameters<typeof saveProfile>[0] = {
        name: name.trim(),
        username,
        bio: bio.trim(),
        link: link.trim(),
      };
      if (avatarFile) patch.avatar_url = await uploadProfileImage(avatarFile, "avatar");
      if (bannerFile) patch.banner_url = await uploadProfileImage(bannerFile, "banner");
      await saveProfile(patch);
      actions.updateProfile({ name: name.trim(), ...(avatarPreview ? { photoUrl: avatarPreview } : {}) });
      toast.success("Perfil atualizado!");
      navigate({ to: "/app/profile" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-8">
      <div className="px-5 pt-8">
        <Link to="/app/profile" className="press inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
          <ArrowLeft size={14} /> Perfil
        </Link>
        <h1 className="mt-4 font-display text-3xl">Personalizar perfil</h1>
      </div>

      {loading ? (
        <div className="mt-20 flex justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          <div className="mt-6 px-5">
            <button
              onClick={() => bannerInput.current?.click()}
              className="press relative block h-36 w-full overflow-hidden rounded-3xl bg-muted"
              aria-label="Trocar imagem de capa"
            >
              {bannerPreview
                ? <img src={bannerPreview} alt="Capa do perfil" className="h-full w-full object-cover" />
                : <span className="flex h-full w-full items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><ImagePlus size={16} /> Adicionar capa</span>}
              <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Capa</span>
            </button>

            <div className="-mt-10 ml-1 flex items-end gap-3">
              <button
                onClick={() => avatarInput.current?.click()}
                className="press relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-muted"
                aria-label="Trocar foto de perfil"
              >
                {avatarPreview
                  ? <img src={avatarPreview} alt="Foto de perfil" className="h-full w-full object-cover" />
                  : <UserIcon size={26} className="mx-auto text-muted-foreground" strokeWidth={1.5} />}
                <span className="absolute bottom-0 left-0 right-0 flex justify-center bg-foreground/70 py-0.5 text-primary-foreground"><Camera size={12} /></span>
              </button>
              <p className="pb-2 text-[11px] text-muted-foreground">Toque para trocar foto e capa</p>
            </div>

            <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e, "avatar")} />
            <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e, "banner")} />
          </div>

          <section className="mx-5 mt-6 space-y-4 rounded-3xl bg-card p-5 shadow-soft">
            <Field label="Nome de exibição">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className={inputCls} placeholder="Como quer ser chamada(o)" />
            </Field>
            <Field label="Apelido (@)">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 focus-within:border-foreground">
                <span className="text-sm text-muted-foreground">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase())}
                  maxLength={20}
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                  placeholder="seunome"
                />
              </div>
            </Field>
            <Field label="Bio">
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} className={inputCls + " resize-none"} placeholder="Fale um pouco do seu estilo" />
              <span className="mt-1 block text-right text-[10px] text-muted-foreground">{bio.length}/160</span>
            </Field>
            <Field label="Link">
              <input value={link} onChange={(e) => setLink(e.target.value)} maxLength={120} className={inputCls} placeholder="instagram.com/seuperfil" />
            </Field>
          </section>

          <div className="mt-5 px-5">
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="press-gold flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-xs uppercase tracking-[0.24em] text-primary-foreground disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Salvar perfil
            </button>
            {profile && (
              <Link to="/app/u/$userId" params={{ userId: profile.id }} className="press mt-3 block text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Ver meu perfil público
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
