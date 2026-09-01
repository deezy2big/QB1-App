import { execFile } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function movieToFrames(inputFile: string, outDir: string) {
  await mkdir(outDir, { recursive: true });
  await exec("ffmpeg", [
    "-y",
    "-i",
    inputFile,
    "-vf",
    "fps=4,scale=800:-1",
    "-frames:v",
    "12",
    path.join(outDir, "%04d.png"),
  ]);
  const names = (await readdir(outDir))
    .filter((n) => n.endsWith(".png"))
    .sort();
  return names.map((n) => path.join(outDir, n));
}
