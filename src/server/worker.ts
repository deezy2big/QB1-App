import { pipelineFor } from "@/lib/pipeline";
import type { Asset, Job, JobOutput, SourceKind } from "@/lib/types";
import { AP_ASSETS, ASSETS } from "@/lib/data";
import { movieToFrames } from "./ffmpeg";
import { appendJobEvent, listJobs, readJob, saveJob } from "./job-store";
import { dataPath } from "./paths";
import { removePhotoBackground } from "./photo-cutout";
import { LocalCutout } from "./providers/cutout-local";
import { LocalApImages, LocalPhotoShelter } from "./providers/source-catalog";
import { listLocalAssets, LocalUploadSource } from "./providers/source-local";
import { LocalStorage } from "./providers/storage-local";
import { LocalVision } from "./providers/vision-local";
import { publish } from "./status-bus";
import { readFile } from "node:fs/promises";
import path from "node:path";

const running = new Set<string>();

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

async function readAssetBytes(asset: Asset) {
  if (asset.source === "local") return new LocalUploadSource().getBytes(asset.id);
  if (asset.source === "ap") return new LocalApImages().getBytes(asset.id);
  return new LocalPhotoShelter().getBytes(asset.id);
}

function jobSource(assets: Asset[]): SourceKind {
  if (assets.length > 0 && assets.every((asset) => asset.source === assets[0].source)) {
    return assets[0].source;
  }
  return "local";
}

export async function runJob(jobId: string) {
  if (running.has(jobId)) return;
  running.add(jobId);
  try {
    await executeJob(jobId);
  } finally {
    running.delete(jobId);
  }
}

export async function resumeIncompleteJobs() {
  const jobs = await listJobs();
  await Promise.all(
    jobs
      .filter((job) => job.status !== "complete" && job.status !== "failed")
      .map((job) => runJob(job.id)),
  );
}

async function executeJob(jobId: string) {
  const job = await readJob(jobId);
  if (!job || job.status === "complete" || job.status === "failed") return;
  const assets = (
    await Promise.all(job.assetIds.map((id) => lookupAsset(id)))
  ).filter((a): a is Asset => Boolean(a));
  if (assets.length !== job.assetIds.length) {
    const missing = job.assetIds.filter((id) => !assets.some((asset) => asset.id === id));
    const message = `Unknown images: ${missing.join(", ")}`;
    const failed = await emit(jobId, "failed", message);
    failed.error = message;
    await saveJob(failed);
    publish(jobId, { job: failed });
    return;
  }

  const storage = new LocalStorage();
  const flatCutout = new LocalCutout();
  const vision = new LocalVision();
  const steps = pipelineFor(assets, job.mode).filter((s) => s.status !== "queued");
  const outputs: JobOutput[] = [];

  try {
    for (const step of steps) {
      if (step.status === "transferring") {
        for (const asset of assets) {
          const bytes = await readAssetBytes(asset);
          const ext = path.extname(asset.name) || (asset.kind === "movie" ? ".mp4" : ".png");
          const key = `inbox/${jobId}/${asset.id}${ext}`;
          await storage.put(key, bytes);
          outputs.push({ assetId: asset.id, originalKey: key });
        }
        await emit(jobId, "transferring", step.message(assets.length, assets.map((a) => a.kind)));
      } else if (step.status === "sequencing") {
        for (const out of outputs) {
          const asset = assets.find((a) => a.id === out.assetId);
          if (asset?.kind !== "movie") continue;
          const tmp = dataPath("tmp", jobId, out.assetId);
          const input = storage.absPath(out.originalKey);
          const frames = await movieToFrames(input, tmp);
          const prefix = `seq/${jobId}/${out.assetId}`;
          for (const frame of frames) {
            const buf = await readFile(frame);
            await storage.put(`${prefix}/${path.basename(frame)}`, buf);
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
              const frame = await storage.get(`${out.sequencePrefix}/${name}`);
              const cut = await flatCutout.removeBackground(frame);
              await storage.put(`${out.sequencePrefix}/cut-${name}`, cut);
            }
            out.processedKey = `${out.sequencePrefix}/cut-0001.png`;
            continue;
          }
          const original = await storage.get(out.originalKey);
          let cut: Buffer;
          if (asset?.source === "local" && asset.kind !== "movie") {
            try {
              cut = await removePhotoBackground(original);
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              throw new Error(`${asset.name}: ${message}`);
            }
          } else {
            cut = await flatCutout.removeBackground(original);
          }
          const key = `out/${jobId}/${out.assetId}.png`;
          await storage.put(key, cut);
          out.processedKey = key;
        }
        await emit(jobId, "cutting_out", step.message(assets.length, assets.map((a) => a.kind)));
      } else if (step.status === "aligning") {
        for (const out of outputs) {
          const asset = assets.find((a) => a.id === out.assetId);
          if (asset?.kind !== "headshot" || !out.processedKey) continue;
          const cut = await storage.get(out.processedKey);
          const aligned = await vision.alignHeadshot(cut);
          await storage.put(out.processedKey, aligned);
        }
        await emit(jobId, "aligning", step.message(assets.length, assets.map((a) => a.kind)));
      } else if (step.status === "complete") {
        if (job.mode === "download") {
          for (const out of outputs) out.processedKey = out.originalKey;
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
  if (input.assetIds.length === 0) throw new Error("Choose at least one image.");
  const assets = (
    await Promise.all(input.assetIds.map((id) => lookupAsset(id)))
  ).filter((a): a is Asset => Boolean(a));
  if (assets.length !== input.assetIds.length) {
    const missing = input.assetIds.filter((id) => !assets.some((asset) => asset.id === id));
    throw new Error(`Unknown images: ${missing.join(", ")}`);
  }
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const job: Job = {
    id,
    createdAt: Date.now(),
    mode: input.mode,
    status: "queued",
    assetIds: input.assetIds,
    source: jobSource(assets),
    events: [
      {
        at: Date.now(),
        status: "queued",
        message: `Queued ${assets.length} image${assets.length === 1 ? "" : "s"}`,
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
