import { readJob } from "@/server/job-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = await readJob(id);
  if (!job) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(job);
}
