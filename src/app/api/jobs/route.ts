import { after } from "next/server";
import { listJobs } from "@/server/job-store";
import { createAndRunJob, runJob } from "@/server/worker";
import type { ActionMode } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await listJobs();
  return Response.json(jobs);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    assetIds?: string[];
    mode?: ActionMode;
    submittedBy?: string;
    office?: string;
  };
  const assetIds = body.assetIds ?? [];
  if (assetIds.length === 0) {
    return Response.json({ error: "assetIds required" }, { status: 400 });
  }
  const job = await createAndRunJob({
    assetIds,
    mode: body.mode === "download" ? "download" : "process",
    submittedBy: body.submittedBy ?? "Unknown",
    office: body.office ?? "Media Design",
  });
  after(() => runJob(job.id));
  return Response.json(job);
}
