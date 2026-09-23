import { buildJobDownload, downloadDisposition, JobDownloadError } from "@/server/job-download";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const file = await buildJobDownload(id);
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.contentType,
        "content-disposition": downloadDisposition(file.filename),
        "content-length": String(file.bytes.length),
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof JobDownloadError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Download failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
