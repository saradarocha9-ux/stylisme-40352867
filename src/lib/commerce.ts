import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Product = Database["public"]["Tables"]["store_products"]["Row"];
export type Campaign = Database["public"]["Tables"]["store_campaigns"]["Row"];

export async function storeAssetUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("store-assets").createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}

export async function uploadStoreAsset(storeId: string, file: File, kind: "product" | "campaign") {
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) throw new Error("Escolha uma imagem de até 8 MB.");
  const extension = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const path = `${storeId}/${kind}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}

export async function listPartnerStores() {
  const { data, error } = await supabase.from("stores").select("*").eq("status", "verified").order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function getPublicStore(slug: string) {
  const { data: store, error } = await supabase.from("stores").select("*").eq("slug", slug).eq("status", "verified").maybeSingle();
  if (error) throw new Error(error.message);
  if (!store) return null;
  const { data: products, error: productsError } = await supabase.from("store_products").select("*").eq("store_id", store.id).eq("published", true).order("created_at", { ascending: false });
  if (productsError) throw new Error(productsError.message);
  return { store, products };
}

export async function getPublicProduct(id: string) {
  const { data, error } = await supabase.from("store_products").select("*, stores!inner(*)").eq("id", id).eq("published", true).eq("stores.status", "verified").maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createStore(input: { name: string; slug: string; description: string; website: string; instagram: string; city: string }) {
  const { data, error } = await supabase.rpc("create_store_with_owner", {
    _name: input.name, _slug: input.slug, _description: input.description,
    _website_url: input.website, _instagram_url: input.instagram,
    _service_area: { scope: input.city ? "city" : "national", cities: input.city ? [input.city] : [] } as Json,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function listMyStores() {
  const { data: auth } = await supabase.auth.getUser(); const userId = auth.user?.id;
  if (!userId) return [];
  const { data: memberships, error } = await supabase.from("store_members").select("store_id").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const ids = memberships.map((m) => m.store_id); if (!ids.length) return [];
  const { data, error: storesError } = await supabase.from("stores").select("*").in("id", ids).order("created_at", { ascending: false });
  if (storesError) throw new Error(storesError.message); return data;
}

export async function listStoreProducts(storeId: string) {
  const { data, error } = await supabase.from("store_products").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message); return data;
}

export async function listStoreCampaigns(storeId: string) {
  const { data, error } = await supabase.from("store_campaigns").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message); return data;
}

export async function createProduct(input: Database["public"]["Tables"]["store_products"]["Insert"]) {
  if (input.destination_url && !safeExternalUrl(input.destination_url)) throw new Error("Use um endereço HTTPS válido.");
  const { error } = await supabase.from("store_products").insert(input); if (error) throw new Error(error.message);
}

export async function createCampaign(input: Database["public"]["Tables"]["store_campaigns"]["Insert"]) {
  if (!safeExternalUrl(input.destination_url)) throw new Error("Use um endereço HTTPS válido.");
  const { error } = await supabase.from("store_campaigns").insert(input); if (error) throw new Error(error.message);
}

export async function submitCampaign(id: string) {
  const { error } = await supabase.rpc("submit_store_campaign", { _campaign_id: id }); if (error) throw new Error(error.message);
}

export async function listCampaignResults(campaignIds: string[]) {
  if (!campaignIds.length) return [];
  const { data, error } = await supabase.from("campaign_events").select("campaign_id,kind").in("campaign_id", campaignIds);
  if (error) throw new Error(error.message);
  return data;
}
