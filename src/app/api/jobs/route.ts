import { after } from "next/server";
import { listJobs } from "@/server/job-store";
import { createAndRunJob, resumeIncompleteJobs, runJob } from "@/server/worker";
import type { ActionMode } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const jobs = await listJobs();
  after(() => resumeIncompleteJobs());
  return Response.json(jobs);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    assetIds?: string[];
    mode?: ActionMode;
    submittedBy?: string;
    office?: string;
  } | null;
  const assetIds = body?.assetIds ?? [];
  if (assetIds.length === 0) {
    return Response.json({ error: "Choose at least one image." }, { status: 400 });
  }
  const submittedBy = (body?.submittedBy ?? "Local operator").trim().slice(0, 80) || "Local operator";
  try {
    const job = await createAndRunJob({
      assetIds,
      mode: body?.mode === "download" ? "download" : "process",
      submittedBy,
      office: (body?.office ?? "Local").trim().slice(0, 80) || "Local",
    });
    after(() => runJob(job.id));
    return Response.json(job);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start the job";
    const status = message.startsWith("Unknown images") || message.startsWith("Choose at least") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
