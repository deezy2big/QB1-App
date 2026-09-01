import sharp from "sharp";
import {
  RASTER_H,
  RASTER_W,
  TARGET_PUPIL_LEFT_X,
  TARGET_PUPIL_RIGHT_X,
  TARGET_PUPIL_Y,
} from "@/lib/portrait-svg";
import type { PupilPair } from "./providers/types";

const MAGENTA = { r: 255, g: 0, b: 255 };

export async function rasterizeSvg(svg: string, width = RASTER_W, height = RASTER_H) {
  return sharp(Buffer.from(svg), { density: 192 })
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();
}

function colorDist(r: number, g: number, b: number, t: { r: number; g: number; b: number }) {
  return Math.abs(r - t.r) + Math.abs(g - t.g) + Math.abs(b - t.b);
}

export async function removeBackground(bytes: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const px = (x: number, y: number) => (y * w + x) * 4;

  for (let i = 0; i < data.length; i += 4) {
    if (colorDist(data[i], data[i + 1], data[i + 2], MAGENTA) < 80) {
      data[i + 3] = 0;
    }
  }

  const corner = {
    r: data[0],
    g: data[1],
    b: data[2],
  };
  const threshold = 48;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const seeds = [0, w - 1, (h - 1) * w, h * w - 1];
  for (const s of seeds) stack.push(s);

  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i]) continue;
    seen[i] = 1;
    const o = i * 4;
    if (data[o + 3] === 0) continue;
    if (colorDist(data[o], data[o + 1], data[o + 2], corner) > threshold) continue;
    data[o + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

export async function findPupils(bytes: Buffer): Promise<PupilPair> {
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const yMax = Math.floor(h * 0.48);
  const left: { x: number; y: number; n: number } = { x: 0, y: 0, n: 0 };
  const right: { x: number; y: number; n: number } = { x: 0, y: 0, n: 0 };

  for (let y = Math.floor(h * 0.18); y < yMax; y++) {
    for (let x = Math.floor(w * 0.18); x < Math.floor(w * 0.82); x++) {
      const o = (y * w + x) * 4;
      if (data[o + 3] < 128) continue;
      const lum = data[o] + data[o + 1] + data[o + 2];
      if (lum > 90) continue;
      const bucket = x < w / 2 ? left : right;
      bucket.x += x;
      bucket.y += y;
      bucket.n += 1;
    }
  }

  if (left.n < 8 || right.n < 8) {
    return {
      left: { x: (TARGET_PUPIL_LEFT_X / RASTER_W) * w, y: (TARGET_PUPIL_Y / RASTER_H) * h },
      right: { x: (TARGET_PUPIL_RIGHT_X / RASTER_W) * w, y: (TARGET_PUPIL_Y / RASTER_H) * h },
    };
  }

  return {
    left: { x: left.x / left.n, y: left.y / left.n },
    right: { x: right.x / right.n, y: right.y / right.n },
  };
}

export async function alignHeadshot(bytes: Buffer, pupils?: PupilPair): Promise<Buffer> {
  const found = pupils ?? (await findPupils(bytes));
  const dx = found.right.x - found.left.x;
  const dy = found.right.y - found.left.y;
  const dist = Math.hypot(dx, dy) || 1;
  const targetDist = TARGET_PUPIL_RIGHT_X - TARGET_PUPIL_LEFT_X;
  const scale = targetDist / dist;
  const midX = (found.left.x + found.right.x) / 2;
  const midY = (found.left.y + found.right.y) / 2;
  const targetMidX = (TARGET_PUPIL_LEFT_X + TARGET_PUPIL_RIGHT_X) / 2;
  const angle = Math.atan2(dy, dx);

  const img = sharp(bytes).ensureAlpha();
  const meta = await img.metadata();
  const scaledW = Math.max(1, Math.round((meta.width ?? RASTER_W) * scale));
  const scaledH = Math.max(1, Math.round((meta.height ?? RASTER_H) * scale));
  const scaled = await img
    .resize(scaledW, scaledH)
    .rotate((-angle * 180) / Math.PI, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const scaledMeta = await sharp(scaled).metadata();
  const sw = scaledMeta.width ?? scaledW;
  const sh = scaledMeta.height ?? scaledH;
  const newMidX = midX * scale;
  const newMidY = midY * scale;
  const left = Math.round(targetMidX - newMidX);
  const top = Math.round(TARGET_PUPIL_Y - newMidY);

  const canvas = sharp({
    create: {
      width: RASTER_W,
      height: RASTER_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  return canvas
    .composite([
      {
        input: scaled,
        left: Math.min(RASTER_W - 1, Math.max(-sw + 1, left)),
        top: Math.min(RASTER_H - 1, Math.max(-sh + 1, top)),
      },
    ])
    .png()
    .toBuffer();
}
