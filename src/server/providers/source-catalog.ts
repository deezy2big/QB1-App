import { AP_ASSETS, ASSETS } from "@/lib/data";
import { portraitSvg } from "@/lib/portrait-svg";
import type { Asset } from "@/lib/types";
import { rasterizeSvg } from "../image-ops";
import { LocalStorage } from "./storage-local";
import type { SourceProvider } from "./types";

const catalogStore = new LocalStorage();

export async function catalogBytes(asset: Asset) {
  const key = `catalog/${asset.id}.png`;
  if (await catalogStore.exists(key)) {
    return catalogStore.get(key);
  }
  const svg = portraitSvg({
    name: asset.player ?? asset.name,
    number: asset.number,
    teamId: asset.teamId,
    kind: asset.kind,
    chroma: true,
  });
  const png = await rasterizeSvg(svg);
  await catalogStore.put(key, png, "image/png");
  return png;
}

export class LocalPhotoShelter implements SourceProvider {
  id = "photoshelter" as const;

  async getAsset(id: string) {
    return ASSETS.find((a) => a.id === id);
  }

  async getBytes(id: string) {
    const asset = await this.getAsset(id);
    if (!asset) throw new Error(`Photo Shelter asset not found: ${id}`);
    return catalogBytes(asset);
  }
}

export class LocalApImages implements SourceProvider {
  id = "ap" as const;

  async getAsset(id: string) {
    return AP_ASSETS.find((a) => a.id === id);
  }

  async getBytes(id: string) {
    const asset = await this.getAsset(id);
    if (!asset) throw new Error(`AP Images asset not found: ${id}`);
    return catalogBytes(asset);
  }

  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return AP_ASSETS;
    return AP_ASSETS.filter((a) =>
      [a.name, a.caption, a.player, a.teamId].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }
}
