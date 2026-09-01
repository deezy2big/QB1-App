import { AP_ASSETS, ASSETS } from "@/lib/data";
import { listJobs } from "@/server/job-store";
import { getProviders, sourceFor } from "@/server/providers";
import { listLocalAssets } from "@/server/providers/source-local";

export const dynamic = "force-dynamic";

async function lookup(id: string) {
  return (
    ASSETS.find((a) => a.id === id) ??
    AP_ASSETS.find((a) => a.id === id) ??
    (await listLocalAssets()).find((a) => a.id === id)
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const variant = new URL(req.url).searchParams.get("variant") ?? "original";
  const asset = await lookup(id);
  if (!asset) return new Response("not found", { status: 404 });

  const storage = getProviders().storage;

  if (variant === "processed") {
    const jobs = await listJobs();
    const hit = jobs
      .filter((j) => j.status === "complete")
      .flatMap((j) => j.outputs)
      .find((o) => o.assetId === id && o.processedKey);
    if (hit?.processedKey) {
      const bytes = await storage.get(hit.processedKey);
      return new Response(bytes, {
        headers: { "content-type": "image/png", "cache-control": "no-store" },
      });
    }
  }

  const bytes = await sourceFor(asset.source).getBytes(id);
  return new Response(bytes, {
    headers: { "content-type": "image/png", "cache-control": "no-store" },
  });
}
