import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IngestError, ingestLocalFiles } from "./local-ingest";
import { buildJobDownload } from "./job-download";
import { registerLocalAsset } from "./providers/source-local";
import { createAndRunJob, resumeIncompleteJobs, runJob } from "./worker";
import { readJob } from "./job-store";
import { dataPath } from "./paths";
import { unzipStore, zipStore } from "./zip-store";

const fixtures = path.join(process.cwd(), "fixtures/photos");

async function alphaMix(png: Buffer) {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const w = info.width;
  const h = info.height;
  let clear = 0;
  let solid = 0;
  let border = 0;
  let borderClear = 0;
  const band = Math.max(2, Math.floor(Math.min(w, h) * 0.03));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha < 16) clear += 1;
      else if (alpha > 200) solid += 1;
      const onBorder = x < band || y < band || x >= w - band || y >= h - band;
      if (onBorder) {
        border += 1;
        if (alpha < 16) borderClear += 1;
      }
    }
  }
  return { clear: clear / n, solid: solid / n, border: borderClear / border };
}

describe("local image job", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "qb1-local-"));
    process.env.QB1_DATA_DIR = dir;
  });

  afterEach(async () => {
    delete process.env.QB1_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it("round-trips a stored zip", () => {
    const files = [
      { name: "a.jpg", data: Buffer.from("jpeg-a") },
      { name: "a.jpg", data: Buffer.from("jpeg-b") },
    ];
    const unpacked = unzipStore(zipStore(files));
    expect(unpacked.map((file) => file.name)).toEqual(["a.jpg", "a (2).jpg"]);
    expect(unpacked[0].data.equals(files[0].data)).toBe(true);
    expect(unpacked[1].data.equals(files[1].data)).toBe(true);
  });

  it("rejects empty, movie, and unreadable uploads", async () => {
    await expect(ingestLocalFiles([])).rejects.toBeInstanceOf(IngestError);
    await expect(
      ingestLocalFiles([{ name: "play.mp4", bytes: Buffer.from("not a movie") }]),
    ).rejects.toThrow(/movie sequences are not available/);
    await expect(
      ingestLocalFiles([{ name: "notes.txt", bytes: Buffer.from("hello") }]),
    ).rejects.toThrow(/JPEG, PNG/);
    await expect(
      ingestLocalFiles([{ name: "broken.jpg", bytes: Buffer.from("not-a-jpeg") }]),
    ).rejects.toThrow(/could not read/);
  });

  it("refuses a job for an unknown image and records a failed cutout", async () => {
    await expect(
      createAndRunJob({
        assetIds: ["missing-image"],
        mode: "process",
        submittedBy: "Local operator",
        office: "Local",
      }),
    ).rejects.toThrow(/Unknown images/);

    await registerLocalAsset(
      {
        id: "bad-photo",
        name: "broken.jpg",
        kind: "portrait",
        source: "local",
        year: 2026,
        folderId: "local",
        width: 10,
        height: 10,
        bytes: 4,
      },
      Buffer.from("nope"),
    );
    const job = await createAndRunJob({
      assetIds: ["bad-photo"],
      mode: "process",
      submittedBy: "Local operator",
      office: "Local",
    });
    await runJob(job.id);
    const failed = await readJob(job.id);
    expect(failed?.status).toBe("failed");
    expect(failed?.error).toMatch(/broken\.jpg/);
    const onDisk = JSON.parse(await readFile(dataPath("jobs", `${job.id}.json`), "utf8")) as {
      status: string;
      error: string;
    };
    expect(onDisk.status).toBe("failed");
    expect(onDisk.error).toMatch(/broken\.jpg/);
  });

  it("downloads a multi-file job as the original bytes", async () => {
    const curie = await readFile(path.join(fixtures, "curie-studio.jpg"));
    const obama = await readFile(path.join(fixtures, "obama-office.png"));
    const assets = await ingestLocalFiles([
      { name: "curie-studio.jpg", bytes: curie },
      { name: "obama-office.png", bytes: obama },
    ]);
    const queued = await createAndRunJob({
      assetIds: assets.map((asset) => asset.id),
      mode: "download",
      submittedBy: "Avery Chen",
      office: "Local",
    });
    expect(queued.status).toBe("queued");
    expect(queued.source).toBe("local");
    await resumeIncompleteJobs();
    const done = await readJob(queued.id);
    expect(done?.status).toBe("complete");
    expect(done?.events.map((event) => event.status)).toEqual(["queued", "transferring", "complete"]);
    const packed = await buildJobDownload(queued.id);
    expect(packed.contentType).toBe("application/zip");
    const files = unzipStore(packed.bytes);
    expect(files.map((file) => file.name).sort()).toEqual(["curie-studio.jpg", "obama-office.png"]);
    const byName = new Map(files.map((file) => [file.name, file.data]));
    expect(byName.get("curie-studio.jpg")?.equals(curie)).toBe(true);
    expect(byName.get("obama-office.png")?.equals(obama)).toBe(true);
  });

  it(
    "processes a multi-file job into background-removed pngs",
    async () => {
      const curie = await readFile(path.join(fixtures, "curie-studio.jpg"));
      const obama = await readFile(path.join(fixtures, "obama-office.jpg"));
      const assets = await ingestLocalFiles([
        { name: "curie-studio.jpg", bytes: curie },
        { name: "obama-office.jpg", bytes: obama },
      ]);
      const job = await createAndRunJob({
        assetIds: assets.map((asset) => asset.id),
        mode: "process",
        submittedBy: "Avery Chen",
        office: "Local",
      });
      await runJob(job.id);
      const done = await readJob(job.id);
      expect(done?.status, done?.error).toBe("complete");
      expect(done?.events.some((event) => event.message === "Processing complete")).toBe(true);
      expect(done?.events.map((event) => event.status)).not.toContain("aligning");
      const packed = await buildJobDownload(job.id);
      const files = unzipStore(packed.bytes);
      expect(files.map((file) => file.name).sort()).toEqual([
        "curie-studio.png",
        "obama-office.png",
      ]);
      for (const file of files) {
        expect(file.data.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
        expect(file.data.equals(curie)).toBe(false);
        expect(file.data.equals(obama)).toBe(false);
        const mix = await alphaMix(file.data);
        expect(mix.clear).toBeGreaterThan(0.15);
        expect(mix.solid).toBeGreaterThan(0.05);
        expect(mix.border).toBeGreaterThan(0.6);
      }
    },
    180_000,
  );
});
