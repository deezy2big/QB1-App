import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Job } from "@/lib/types";
import { dataPath } from "./paths";

function jobsDir() {
  return dataPath("jobs");
}

async function ensure() {
  await mkdir(jobsDir(), { recursive: true });
}

function fileFor(id: string) {
  return path.join(jobsDir(), `${id}.json`);
}

export async function saveJob(job: Job) {
  await ensure();
  await writeFile(fileFor(job.id), JSON.stringify(job, null, 2));
}

export async function readJob(id: string): Promise<Job | undefined> {
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8")) as Job;
  } catch {
    return undefined;
  }
}

export async function listJobs(): Promise<Job[]> {
  await ensure();
  const dir = jobsDir();
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json"));
  const jobs = await Promise.all(
    names.map(async (n) => JSON.parse(await readFile(path.join(dir, n), "utf8")) as Job),
  );
  return jobs.sort((a, b) => b.createdAt - a.createdAt);
}

export async function appendJobEvent(id: string, status: Job["status"], message: string) {
  const job = await readJob(id);
  if (!job) throw new Error(`Job not found: ${id}`);
  job.status = status;
  job.events.push({ at: Date.now(), status, message });
  await saveJob(job);
  return job;
}
