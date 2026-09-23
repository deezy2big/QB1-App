import path from "node:path";
import sharp from "sharp";
import type { Asset } from "@/lib/types";
import { registerLocalAsset } from "./providers/source-local";

const STILL = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".tif", ".tiff"]);
const MOVIE = /\.(mp4|mov|m4v|webm|avi|mkv)$/i;
const MAX_BYTES = 20 * 1024 * 1024;

export class IngestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestError";
  }
}

export async function ingestLocalFiles(
  files: { name: string; bytes: Buffer }[],
): Promise<Asset[]> {
  if (files.length === 0) throw new IngestError("Choose at least one image.");

  const ready: { name: string; bytes: Buffer; width: number; height: number }[] = [];
  for (const file of files) {
    const name = path.basename(file.name || "").trim() || "image";
    if (MOVIE.test(name)) {
      throw new IngestError(
        `${name}: movie sequences are not available yet. Choose a still image.`,
      );
    }
    const ext = path.extname(name).toLowerCase();
    if (!STILL.has(ext)) {
      throw new IngestError(`${name}: choose a JPEG, PNG, WebP, GIF, or TIFF image.`);
    }
    if (file.bytes.length === 0) throw new IngestError(`${name}: the file is empty.`);
    if (file.bytes.length > MAX_BYTES) {
      throw new IngestError(`${name}: images must be 20 MB or smaller.`);
    }
    try {
      const meta = await sharp(file.bytes, { failOn: "none" }).metadata();
      if (!meta.width || !meta.height) throw new Error("no dimensions");
      ready.push({ name, bytes: file.bytes, width: meta.width, height: meta.height });
    } catch (err) {
      if (err instanceof IngestError) throw err;
      throw new IngestError(`${name}: could not read that file as an image.`);
    }
  }

  const assets: Asset[] = [];
  for (const [i, file] of ready.entries()) {
    const asset: Asset = {
      id: `local-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      kind: "portrait",
      source: "local",
      year: new Date().getFullYear(),
      folderId: "local",
      width: file.width,
      height: file.height,
      bytes: file.bytes.length,
    };
    assets.push(await registerLocalAsset(asset, file.bytes));
  }
  return assets;
}
