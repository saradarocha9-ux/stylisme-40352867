import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { storeAssetUrl, updateStore, uploadStoreAsset, type Store } from "@/lib/commerce";

export function StoreEditor({ store, onSaved }: { store: Store; onSaved: () => Promise<void> | void }) {
  const [form, setForm] = useState({ name: store.name, description: store.description, website: store.website_url ?? "", instagram: store.instagram_url ?? "" });
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ logo: string | null; banner: string | null }>({ logo: null, banner: null });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm({ name: store.name, description: store.description, website: store.website_url ?? "", instagram: store.instagram_url ?? "" });
    void Promise.all([storeAssetUrl(store.logo_path), storeAssetUrl(store.banner_path)]).then(([l, b]) => setPreview({ logo: l, banner: b }));
  }, [store]);
  const pick = (kind: "logo" | "banner", file: File | null) => {
    if (kind === "logo") setLogo(file); else setBanner(file);
    if (file) setPreview((p) => ({ ...p, [kind]: URL.createObjectURL(file) }));
  };
  async function save() {
    setSaving(true);
    try {
      const logo_path = logo ? await uploadStoreAsset(store.id, logo, "logo") : store.logo_path;
      const banner_path = banner ? await uploadStoreAsset(store.id, banner, "banner") : store.banner_path;
      await updateStore(store.id, { name: form.name.trim(), description: form.description.trim(), website_url: form.website.trim() || null, instagram_url: form.instagram.trim() || null, logo_path, banner_path });
      setLogo(null); setBanner(null);
      toast.success("Loja atualizada.");
      await onSaved();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }
  const input = "mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm normal-case text-foreground";
  return <section className="mt-6 space-y-3 rounded-2xl bg-card p-4 shadow-soft">
    <h2 className="font-display text-2xl">Editar loja</h2>
    <label className="block cursor-pointer"><div className="aspect-[3/1] overflow-hidden rounded-xl bg-muted">{preview.banner ? <img src={preview.banner} alt="" className="h-full w-full object-cover" /> : <p className="grid h-full place-items-center text-xs text-muted-foreground">Toque para escolher o banner</p>}</div><input type="file" accept="image/*" className="hidden" onChange={(e) => pick("banner", e.target.files?.[0] ?? null)} /></label>
    <label className="flex cursor-pointer items-center gap-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">{preview.logo && <img src={preview.logo} alt="" className="h-full w-full object-cover" />}</div><span className="text-xs underline">Trocar foto da loja</span><input type="file" accept="image/*" className="hidden" onChange={(e) => pick("logo", e.target.files?.[0] ?? null)} /></label>
    <label className="block text-[10px] uppercase text-muted-foreground">Nome<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} /></label>
    <label className="block text-[10px] uppercase text-muted-foreground">Descrição<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} /></label>
    <label className="block text-[10px] uppercase text-muted-foreground">Site HTTPS<input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={input} /></label>
    <label className="block text-[10px] uppercase text-muted-foreground">Instagram HTTPS<input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={input} /></label>
    <Button className="w-full" disabled={saving} onClick={() => void save()}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
  </section>;
}
