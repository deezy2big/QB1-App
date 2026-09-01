import { teamById } from "./data";
import type { AssetKind } from "./types";

/** Magenta screen used by the local cutout adapter. */
export const CHROMA_HEX = "#FF00FF";
export const SVG_W = 200;
export const SVG_H = 240;
export const RASTER_W = 800;
export const RASTER_H = 960;
export const PUPIL_LEFT = { x: 88, y: 74 };
export const PUPIL_RIGHT = { x: 112, y: 74 };
export const TARGET_PUPIL_Y = 300;
export const TARGET_PUPIL_LEFT_X = 340;
export const TARGET_PUPIL_RIGHT_X = 460;

export function portraitSvg(opts: {
  name?: string;
  number?: string;
  teamId?: string;
  kind?: AssetKind;
  chroma?: boolean;
}): string {
  const team = teamById(opts.teamId);
  const primary = team?.primary ?? "#1a1a1a";
  const secondary = team?.secondary ?? "#c8a24a";
  const kind = opts.kind ?? "headshot";
  const name = opts.name ?? "Player";
  const number = opts.number ?? "0";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const bg = opts.chroma
    ? CHROMA_HEX
    : kind === "action"
      ? "#0e3b22"
      : primary;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}">
  <rect width="${SVG_W}" height="${SVG_H}" fill="${bg}"/>
  ${kind === "action" && !opts.chroma ? `<ellipse cx="160" cy="200" rx="70" ry="28" fill="#147a3a" opacity="0.5"/>` : ""}
  ${kind === "movie" ? `<rect x="12" y="18" width="176" height="120" rx="6" fill="#0b0b0b"/>` : ""}
  <ellipse cx="100" cy="210" rx="62" ry="28" fill="#111111"/>
  <rect x="58" y="128" width="84" height="90" rx="18" fill="${primary}"/>
  <rect x="58" y="128" width="84" height="18" fill="${secondary}" opacity="0.85"/>
  <circle cx="100" cy="92" r="36" fill="#e8c7a8"/>
  <ellipse cx="100" cy="78" rx="28" ry="16" fill="#2a2118"/>
  <circle cx="${PUPIL_LEFT.x}" cy="${PUPIL_LEFT.y}" r="3.2" fill="#1a120c"/>
  <circle cx="${PUPIL_RIGHT.x}" cy="${PUPIL_RIGHT.y}" r="3.2" fill="#1a120c"/>
  <text x="100" y="176" text-anchor="middle" fill="${secondary}" font-size="22" font-weight="700" font-family="sans-serif">${escapeXml(number)}</text>
  <text x="100" y="228" text-anchor="middle" fill="#ffffff" font-size="11" font-family="sans-serif">${escapeXml(initials)}</text>
</svg>`;
}

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
