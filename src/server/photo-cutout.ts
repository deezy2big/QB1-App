import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

/**
 * Local still-image cutout. This is an on-disk ONNX model shipped with the
 * app. It is not Adobe, and it does not call adobe-v2.
 */
const MODEL = "medium" as const;

let chain: Promise<unknown> = Promise.resolve();

function publicPath() {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const entry = require.resolve("@imgly/background-removal-node");
  return pathToFileURL(path.dirname(entry) + path.sep).href;
}

function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function alphaMix(png: Buffer) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const n = info.width * info.height;
  let clear = 0;
  let solid = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 16) clear += 1;
    else if (data[i] > 200) solid += 1;
  }
  return { clear: clear / n, solid: solid / n };
}

export async function removePhotoBackground(bytes: Buffer): Promise<Buffer> {
  return exclusive(async () => {
    const prepared = await sharp(bytes, { failOn: "none" })
      .rotate()
      .ensureAlpha()
      .png()
      .toBuffer();
    const { removeBackground } = await import("@imgly/background-removal-node");
    let blob: Blob;
    try {
      blob = await removeBackground(new Blob([new Uint8Array(prepared)], { type: "image/png" }), {
        publicPath: publicPath(),
        model: MODEL,
        output: { format: "image/png", quality: 1 },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Background removal failed: ${message}`);
    }
    const png = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().png().toBuffer();
    const mix = await alphaMix(png);
    if (mix.clear < 0.05) {
      throw new Error("Background removal did not clear the background");
    }
    if (mix.solid < 0.02) {
      throw new Error("Background removal did not keep the subject");
    }
    return png;
  });
}
