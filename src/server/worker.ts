import { pipelineFor } from "@/lib/pipeline";
import type { Asset, Job, JobOutput } from "@/lib/types";
import { AP_ASSETS, ASSETS } from "@/lib/data";
import { movieToFrames } from "./ffmpeg";
import { appendJobEvent, readJob, saveJob } from "./job-store";
import { dataPath } from "./paths";
import { getProviders, sourceFor } from "./providers";
import { listLocalAssets } from "./providers/source-local";
import { publish } from "./status-bus";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function lookupAsset(id: string): Promise<Asset | undefined> {
  return (
    ASSETS.find((a) => a.id === id) ??
    AP_ASSETS.find((a) => a.id === id) ??
    (await listLocalAssets()).find((a) => a.id === id)
  );
}

async function emit(jobId: string, status: Job["status"], message: string) {
  const job = await appendJobEvent(jobId, status, message);
  publish(jobId, { job });
  return job;
}

export async function runJob(jobId: string) {
  const job = await readJob(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  const assets = (
    await Promise.all(job.assetIds.map((id) => lookupAsset(id)))
  ).filter((a): a is Asset => Boolean(a));
  if (assets.length === 0) {
    await emit(jobId, "failed", "No assets resolved for this job");
    return;
  }

  const providers = getProviders();
  const steps = pipelineFor(assets, job.mode).filter((s) => s.status !== "queued");
  const outputs: JobOutput[] = [];

  try {
    for (const step of steps) {
      if (step.status === "transferring") {
        for (const asset of assets) {
          const bytes = await sourceFor(asset.source).getBytes(asset.id);
          const ext =
            path.extname(asset.name) || (asset.kind === "movie" ? ".mp4" : ".png");
          const key = `inbox/${jobId}/${asset.id}${ext}`;
          await providers.storage.put(key, bytes);
          outputs.push({ assetId: asset.id, originalKey: key });
        }
        await emit(
          jobId,
          "transferring",
          step.message(assets.length, assets.map((a) => a.kind)),
        );
      } else if (step.status === "sequencing") {
        for (const out of outputs) {
          const asset = assets.find((a) => a.id === out.assetId);
          if (asset?.kind !== "movie") continue;
          const tmp = dataPath("tmp", jobId, out.assetId);
          const input = providers.storage.absPath
            ? providers.storage.absPath(out.originalKey)
            : dataPath(out.originalKey);
          const frames = await movieToFrames(input, tmp);
          const prefix = `seq/${jobId}/${out.assetId}`;
          for (const frame of frames) {
            const buf = await readFile(frame);
            await providers.storage.put(
              `${prefix}/${path.basename(frame)}`,
              buf,
            );
          }
          out.sequencePrefix = prefix;
          out.frameCount = frames.length;
        }
        await emit(jobId, "sequencing", step.message(assets.length, assets.map((a) => a.kind)));
      } else if (step.status === "cutting_out") {
        for (const out of outputs) {
          const asset = assets.find((a) => a.id === out.assetId);
          if (out.sequencePrefix && out.frameCount) {
            for (let i = 1; i <= out.frameCount; i++) {
              const name = String(i).padStart(4, "0") + ".png";
              const frame = await providers.storage.get(`${out.sequencePrefix}/${name}`);
              const cut = await providers.cutout.removeBackground(frame);
              await providers.storage.put(`${out.sequencePrefix}/cut-${name}`, cut);
            }
            out.processedKey = `${out.sequencePrefix}/cut-0001.png`;
          } else {
            const original = await providers.storage.get(out.originalKey);
            const cut = await providers.cutout.removeBackground(original);
            const key = `out/${jobId}/${out.assetId}.png`;
            await providers.storage.put(key, cut);
            out.processedKey = key;
          }
        }
        await emit(jobId, "cutting_out", step.message(assets.length, assets.map((a) => a.kind)));
      } else if (step.status === "aligning") {
        for (const out of outputs) {
          const asset = assets.find((a) => a.id === out.assetId);
          if (asset?.kind !== "headshot" || !out.processedKey) continue;
          const cut = await providers.storage.get(out.processedKey);
          const aligned = await providers.vision.alignHeadshot(cut);
          await providers.storage.put(out.processedKey, aligned);
        }
        await emit(jobId, "aligning", step.message(assets.length, assets.map((a) => a.kind)));
      } else if (step.status === "complete") {
        if (job.mode === "download") {
          for (const out of outputs) {
            out.processedKey = out.originalKey;
          }
        }
        const latest = await readJob(jobId);
        if (!latest) return;
        latest.outputs = outputs;
        latest.status = "complete";
        latest.events.push({
          at: Date.now(),
          status: "complete",
          message: step.message(assets.length, assets.map((a) => a.kind)),
        });
        await saveJob(latest);
        publish(jobId, { job: latest });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failed = await emit(jobId, "failed", message);
    failed.error = message;
    await saveJob(failed);
    publish(jobId, { job: failed });
  }
}

export async function createAndRunJob(input: {
  assetIds: string[];
  mode: Job["mode"];
  submittedBy: string;
  office: string;
}) {
  const assets = (
    await Promise.all(input.assetIds.map((id) => lookupAsset(id)))
  ).filter((a): a is Asset => Boolean(a));
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const job: Job = {
    id,
    createdAt: Date.now(),
    mode: input.mode,
    status: "queued",
    assetIds: input.assetIds,
    events: [
      {
        at: Date.now(),
        status: "queued",
        message: `Database record created · ${assets.length} asset${assets.length === 1 ? "" : "s"} queued`,
      },
    ],
    submittedBy: input.submittedBy,
    office: input.office,
    outputs: [],
  };
  await saveJob(job);
  publish(id, { job });
  return job;
}
