import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Asset } from "@/lib/types";
import { dataPath } from "../paths";
import { LocalStorage } from "./storage-local";
import type { SourceProvider } from "./types";

function indexPath() {
  return dataPath("local-assets.json");
}

export async function listLocalAssets(): Promise<Asset[]> {
  try {
    const raw = await readFile(indexPath(), "utf8");
    return JSON.parse(raw) as Asset[];
  } catch {
    return [];
  }
}

async function saveLocalAssets(assets: Asset[]) {
  const index = indexPath();
  await mkdir(path.dirname(index), { recursive: true });
  await writeFile(index, JSON.stringify(assets, null, 2));
}

export async function registerLocalAsset(asset: Asset, bytes: Buffer) {
  const storage = new LocalStorage();
  const ext = path.extname(asset.name) || (asset.kind === "movie" ? ".mp4" : ".png");
  const fileKey = `inbox/local/${asset.id}${ext}`;
  await storage.put(fileKey, bytes);
  const stored = { ...asset, fileKey };
  const all = await listLocalAssets();
  await saveLocalAssets([stored, ...all.filter((a) => a.id !== asset.id)]);
  return stored;
}

export class LocalUploadSource implements SourceProvider {
  id = "local" as const;

  async getAsset(id: string) {
    const all = await listLocalAssets();
    return all.find((a) => a.id === id);
  }

  async getBytes(id: string) {
    const storage = new LocalStorage();
    const asset = await this.getAsset(id);
    const key = asset?.fileKey ?? `inbox/local/${id}`;
    return storage.get(key);
  }
}
