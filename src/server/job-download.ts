import path from "node:path";
import { AP_ASSETS, ASSETS } from "@/lib/data";
import { readJob } from "./job-store";
import { LocalStorage } from "./providers/storage-local";
import { listLocalAssets } from "./providers/source-local";
import { zipStore } from "./zip-store";

export class JobDownloadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "JobDownloadError";
    this.status = status;
  }
}

export type DownloadFile = {
  filename: string;
  bytes: Buffer;
  contentType: string;
};

export function mimeForName(name: string) {
  switch (path.extname(name).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".tif":
    case ".tiff":
      return "image/tiff";
    case ".zip":
      return "application/zip";
    default:
      return "image/png";
  }
}

function pngName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.png`;
}

async function assetName(id: string) {
  const local = (await listLocalAssets()).find((a) => a.id === id);
  return (
    local?.name ??
    ASSETS.find((a) => a.id === id)?.name ??
    AP_ASSETS.find((a) => a.id === id)?.name
  );
}

export async function buildJobDownload(id: string): Promise<DownloadFile> {
  const job = await readJob(id);
  if (!job) throw new JobDownloadError("Job not found", 404);
  if (job.status === "failed") {
    throw new JobDownloadError(job.error || "Job failed", 409);
  }
  if (job.status !== "complete") {
    throw new JobDownloadError("Job is not ready to download", 409);
  }
  if (job.outputs.length === 0) {
    throw new JobDownloadError("Job has no files", 409);
  }

  const storage = new LocalStorage();
  const files: { name: string; data: Buffer }[] = [];
  for (const out of job.outputs) {
    const name = (await assetName(out.assetId)) || `${out.assetId}.png`;
    if (job.mode === "download") {
      files.push({ name, data: await storage.get(out.originalKey) });
    } else if (out.processedKey) {
      files.push({ name: pngName(name), data: await storage.get(out.processedKey) });
    } else {
      throw new JobDownloadError(`Missing processed file for ${name}`, 409);
    }
  }

  if (files.length === 1) {
    return {
      filename: files[0].name,
      bytes: files[0].data,
      contentType: mimeForName(files[0].name),
    };
  }
  return {
    filename: `${job.id}.zip`,
    bytes: zipStore(files),
    contentType: "application/zip",
  };
}

export function downloadDisposition(filename: string) {
  const ascii = filename.replace(/[^\w.\- ()]+/g, "_");
  return `attachment; filename="${ascii}"`;
}
