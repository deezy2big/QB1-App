import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ASSETS } from "@/lib/data";
import { portraitSvg } from "@/lib/portrait-svg";
import { rasterizeSvg } from "@/server/image-ops";
import { registerLocalAsset } from "@/server/providers/source-local";
import { createAndRunJob, runJob } from "@/server/worker";
import { dataPath } from "@/server/paths";

const exec = promisify(execFile);

async function tinyMovie(dir: string) {
  const png = await rasterizeSvg(
    portraitSvg({ name: "Clip", number: "1", kind: "movie", chroma: true }),
  );
  const still = path.join(dir, "still.png");
  const mp4 = path.join(dir, "clip.mp4");
  await writeFile(still, png);
  await exec("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    still,
    "-t",
    "1",
    "-pix_fmt",
    "yuv420p",
    mp4,
  ]);
  return readFile(mp4);
}

describe("runJob", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "qb1-"));
    process.env.QB1_DATA_DIR = dir;
  });

  afterEach(async () => {
    delete process.env.QB1_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it("download copies originals and skips cutout", async () => {
    const asset = ASSETS.find((a) => a.kind === "headshot")!;
    const job = await createAndRunJob({
      assetIds: [asset.id],
      mode: "download",
      submittedBy: "Test",
      office: "Media Design",
    });
    await runJob(job.id);
    const done = JSON.parse(
      await readFile(dataPath("jobs", `${job.id}.json`), "utf8"),
    ) as typeof job;
    expect(done.status).toBe("complete");
    expect(done.events.map((e) => e.status)).toEqual([
      "queued",
      "transferring",
      "complete",
    ]);
    expect(done.outputs[0].processedKey).toBe(done.outputs[0].originalKey);
  });

  it("headshot process cutouts and aligns onto the registration line", async () => {
    const asset = ASSETS.find((a) => a.kind === "headshot")!;
    const job = await createAndRunJob({
      assetIds: [asset.id],
      mode: "process",
      submittedBy: "Test",
      office: "Media Design",
    });
    await runJob(job.id);
    const done = JSON.parse(
      await readFile(dataPath("jobs", `${job.id}.json`), "utf8"),
    ) as typeof job;
    expect(done.status).toBe("complete");
    expect(done.events.map((e) => e.status)).toEqual([
      "queued",
      "transferring",
      "cutting_out",
      "aligning",
      "complete",
    ]);
    const key = done.outputs[0].processedKey!;
    const png = await readFile(dataPath(key));
    const sharp = (await import("sharp")).default;
    const { data } = await sharp(png).ensureAlpha().raw().toBuffer({
      resolveWithObject: true,
    });
    expect(data[3]).toBe(0);
  });

  it("movie process sequences frames then cutouts", async () => {
    const bytes = await tinyMovie(dir);
    const asset = await registerLocalAsset(
      {
        id: "local-movie-1",
        name: "clip.mp4",
        kind: "movie",
        source: "local",
        year: 2026,
        folderId: "local",
        width: 800,
        height: 960,
        bytes: bytes.length,
      },
      bytes,
    );
    const job = await createAndRunJob({
      assetIds: [asset.id],
      mode: "process",
      submittedBy: "Test",
      office: "Media Design",
    });
    await runJob(job.id);
    const done = JSON.parse(
      await readFile(dataPath("jobs", `${job.id}.json`), "utf8"),
    ) as typeof job;
    expect(done.status).toBe("complete");
    expect(done.events.map((e) => e.status)).toContain("sequencing");
    expect(done.events.map((e) => e.status)).toContain("cutting_out");
    expect(done.outputs[0].frameCount).toBeGreaterThan(0);
    expect(done.outputs[0].processedKey).toMatch(/cut-0001\.png$/);
  });
});
