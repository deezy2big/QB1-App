import path from "node:path";
import { AP_ASSETS, ASSETS } from "@/lib/data";
import { listJobs, readJob } from "@/server/job-store";
import { LocalStorage } from "@/server/providers/storage-local";
import { LocalApImages, LocalPhotoShelter } from "@/server/providers/source-catalog";
import { listLocalAssets, LocalUploadSource } from "@/server/providers/source-local";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function lookup(id: string) {
  return (
    ASSETS.find((a) => a.id === id) ??
    AP_ASSETS.find((a) => a.id === id) ??
    (await listLocalAssets()).find((a) => a.id === id)
  );
}

function mimeFor(name: string) {
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
    default:
      return "image/png";
  }
}

async function originalBytes(id: string, source: "photoshelter" | "ap" | "local") {
  if (source === "local") return new LocalUploadSource().getBytes(id);
  if (source === "ap") return new LocalApImages().getBytes(id);
  return new LocalPhotoShelter().getBytes(id);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const variant = url.searchParams.get("variant") ?? "original";
  const asset = await lookup(id);
  if (!asset) return new Response("not found", { status: 404 });

  const storage = new LocalStorage();
  const jobId = url.searchParams.get("job");
  if (jobId) {
    const job = await readJob(jobId);
    const out = job?.outputs.find((item) => item.assetId === id);
    if (job?.status === "complete" && job.mode === "process" && out?.processedKey) {
      const bytes = await storage.get(out.processedKey);
      return new Response(new Uint8Array(bytes), {
        headers: { "content-type": "image/png", "cache-control": "no-store" },
      });
    }
  }

  if (variant === "processed") {
    const jobs = await listJobs();
    const hit = jobs
      .filter((j) => j.status === "complete" && j.mode === "process")
      .flatMap((j) => j.outputs)
      .find((o) => o.assetId === id && o.processedKey);
    if (hit?.processedKey) {
      const bytes = await storage.get(hit.processedKey);
      return new Response(new Uint8Array(bytes), {
        headers: { "content-type": "image/png", "cache-control": "no-store" },
      });
    }
  }

  const bytes = await originalBytes(id, asset.source);
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": mimeFor(asset.name), "cache-control": "no-store" },
  });
}
