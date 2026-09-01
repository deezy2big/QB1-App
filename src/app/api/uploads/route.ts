import { registerLocalAsset } from "@/server/providers/source-local";
import type { Asset } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return Response.json({ error: "files required" }, { status: 400 });
  }

  const assets: Asset[] = [];
  for (const [i, file] of files.entries()) {
    const movie = /\.(mp4|mov|m4v|webm)$/i.test(file.name);
    const asset: Asset = {
      id: `local-${Date.now()}-${i}`,
      name: file.name,
      kind: movie ? "movie" : "action",
      source: "local",
      year: new Date().getFullYear(),
      folderId: "local",
      width: 1920,
      height: 1080,
      bytes: file.size,
    };
    const bytes = Buffer.from(await file.arrayBuffer());
    assets.push(await registerLocalAsset(asset, bytes));
  }

  return Response.json(assets);
}
