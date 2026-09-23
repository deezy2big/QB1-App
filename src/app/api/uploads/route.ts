import { IngestError, ingestLocalFiles } from "@/server/local-ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  try {
    const assets = await ingestLocalFiles(
      await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          bytes: Buffer.from(await file.arrayBuffer()),
        })),
      ),
    );
    return Response.json(assets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = err instanceof IngestError ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
