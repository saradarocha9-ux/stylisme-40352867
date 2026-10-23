const PREFIX = "stylisme-image:";
let database: Promise<IDBDatabase> | undefined;
const known = new Map<string, string>();
function openImages() {
  if (!database) database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("stylisme-private-images", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("images");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => { database = undefined; reject(new Error("Feche outras abas do Stylisme e tente novamente.")); };
    request.addEventListener("success", () => {
      request.result.onversionchange = () => { request.result.close(); database = undefined; };
    });
  });
  return database;
}
async function put(key: string, blob: Blob) {
  const db = await openImages();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("images", "readwrite");
    tx.objectStore("images").put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
async function get(key: string): Promise<Blob | undefined> {
  const db = await openImages();
  return new Promise((resolve, reject) => {
    const request = db.transaction("images").objectStore("images").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Foto inválida"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
async function visit(value: unknown, convert: (text: string) => Promise<unknown>): Promise<unknown> {
  if (typeof value === "string") return convert(value);
  if (Array.isArray(value)) {
    const result = [];
    for (const entry of value) result.push(await visit(entry, convert));
    return result;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) result[key] = await visit(entry, convert);
    return result;
  }
  return value;
}
export async function packImages<T>(owner: string, state: T): Promise<T> {
  if (typeof indexedDB === "undefined") return state;
  const used = new Set<string>();
  const packed = await visit(state, async (text) => {
    if (!text.startsWith("data:image/")) return text;
    const cacheKey = `${owner}:${text}`;
    used.add(cacheKey);
    const existing = known.get(cacheKey);
    if (existing) return existing;
    const ref = `${PREFIX}${encodeURIComponent(owner)}:${crypto.randomUUID()}`;
    const blob = await (await fetch(text)).blob();
    await put(ref, blob);
    known.set(cacheKey, ref);
    return ref;
  });
  for (const key of known.keys()) if (key.startsWith(`${owner}:`) && !used.has(key)) known.delete(key);
  return packed as T;
}
export async function resolveImages<T>(owner: string, state: T): Promise<{ state: T; replacements: Map<string, string> }> {
  const replacements = new Map<string, string>();
  const resolved = await visit(state, async (text) => {
    if (!text.startsWith(PREFIX)) return text;
    if (!text.startsWith(`${PREFIX}${encodeURIComponent(owner)}:`)) throw new Error("A foto pertence a outra conta.");
    const existing = replacements.get(text);
    if (existing) return existing;
    const blob = await get(text);
    if (!blob) throw new Error("Não foi possível recuperar uma foto salva neste aparelho.");
    const url = await asDataUrl(blob);
    replacements.set(text, url);
    known.set(`${owner}:${url}`, text);
    return url;
  });
  return { state: resolved as T, replacements };
}
export function replaceImageRefs<T>(value: T, replacements: Map<string, string>): T {
  if (typeof value === "string") return (replacements.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map((entry) => replaceImageRefs(entry, replacements)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceImageRefs(entry, replacements)])) as T;
  return value;
}
export async function deleteLocalImages(owner: string) {
  if (typeof indexedDB === "undefined") return;
  const db = await openImages();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("images", "readwrite");
    const request = tx.objectStore("images").openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(`${PREFIX}${encodeURIComponent(owner)}:`)) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  for (const key of known.keys()) if (key.startsWith(`${owner}:`)) known.delete(key);
}