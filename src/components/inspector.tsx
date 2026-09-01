"use client";

import { cn } from "@/lib/utils";
import { Portrait } from "@/lib/portrait";
import { formatBytes, teamById } from "@/lib/data";
import { RASTER_H, TARGET_PUPIL_Y } from "@/lib/portrait-svg";
import { statusLabel } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Inspector() {
  const {
    selectedIds,
    queueIds,
    getAsset,
    mode,
    setMode,
    submitJob,
    view,
    removeFromQueue,
    clearQueue,
    jobs,
    processedRevision,
  } = useStore();

  const pool = view === "ap" ? queueIds : selectedIds;
  const assets = pool.map((id) => getAsset(id)).filter((a): a is Asset => Boolean(a));
  const single = assets.length === 1 ? assets[0] : null;
  const team = teamById(single?.teamId);
  const latest = jobs[0];
  const processedAt = single ? processedRevision(single.id) : null;

  function go() {
    if (assets.length === 0) return;
    submitJob(assets.map((a) => a.id));
  }

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-white/10 bg-[#10141c]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-[11px] font-medium tracking-[0.16em] text-[#c8a24a] uppercase">
          Inspector
        </p>
        <p className="mt-1 text-sm text-white/70">
          {assets.length === 0
            ? "Select images to process or download"
            : assets.length === 1
              ? "1 image selected"
              : `${assets.length} images selected`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {single ? (
          <div>
            <div
              className="relative aspect-[5/6] overflow-hidden rounded-md border border-white/10"
              style={
                processedAt
                  ? {
                      backgroundImage:
                        "linear-gradient(45deg,#3a3a3a 25%,transparent 25%),linear-gradient(-45deg,#3a3a3a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a3a3a 75%),linear-gradient(-45deg,transparent 75%,#3a3a3a 75%)",
                      backgroundSize: "16px 16px",
                      backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
                      backgroundColor: "#2a2a2a",
                    }
                  : { background: "#000" }
              }
            >
              {processedAt || single.source === "local" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    processedAt
                      ? `/api/assets/${single.id}/file?variant=processed&t=${processedAt}`
                      : `/api/assets/${single.id}/file`
                  }
                  alt={single.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Portrait
                  name={single.player ?? single.name}
                  number={single.number}
                  teamId={single.teamId}
                  kind={single.kind}
                />
              )}
              {processedAt && single.kind === "headshot" && (
                <div
                  className="pointer-events-none absolute inset-x-0 border-t border-[#69BE28]/80"
                  style={{ top: `${(TARGET_PUPIL_Y / RASTER_H) * 100}%` }}
                />
              )}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">{single.name}</h3>
            <dl className="mt-2 space-y-1 text-xs text-white/60">
              {single.player && (
                <Row label="Player" value={`${single.player}${single.position ? ` · ${single.position}` : ""}`} />
              )}
              {team && <Row label="Team" value={`${team.city} ${team.name}`} />}
              <Row label="Kind" value={single.kind} />
              <Row label="Source" value={single.source} />
              <Row label="Year" value={String(single.year)} />
              <Row label="Size" value={`${single.width}×${single.height} · ${formatBytes(single.bytes)}`} />
            </dl>
          </div>
        ) : assets.length > 1 ? (
          <div>
            <p className="text-sm text-white">Group of {assets.length}</p>
            <p className="mt-1 text-xs text-white/55">
              {summarize(assets)}
            </p>
            <ul className="mt-3 space-y-1.5">
              {assets.slice(0, 12).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 text-xs text-white/70"
                >
                  <span className="truncate">{a.player ?? a.name}</span>
                  <Badge variant="outline" className="border-white/15 text-[10px] text-white/50">
                    {a.kind}
                  </Badge>
                </li>
              ))}
              {assets.length > 12 && (
                <li className="text-xs text-white/40">+{assets.length - 12} more</li>
              )}
            </ul>
            {view === "ap" && (
              <button
                type="button"
                className="mt-3 text-xs text-white/45 underline-offset-2 hover:underline"
                onClick={clearQueue}
              >
                Clear queue
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-white/45">
            Process runs cutout (local stand-in for Adobe) and pupil alignment
            on headshots. Download copies the original without processing.
          </p>
        )}

        {view === "ap" && queueIds.length > 0 && single && (
          <button
            type="button"
            className="mt-3 text-xs text-white/45 hover:text-white"
            onClick={() => removeFromQueue(single.id)}
          >
            Remove from queue
          </button>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="grid grid-cols-2 gap-1 rounded-md bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setMode("process")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded px-2 py-2 text-xs font-medium",
              mode === "process"
                ? "bg-[#c8a24a] text-black"
                : "text-white/60 hover:text-white",
            )}
          >
            <Sparkles className="size-3.5" />
            Process
          </button>
          <button
            type="button"
            onClick={() => setMode("download")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded px-2 py-2 text-xs font-medium",
              mode === "download"
                ? "bg-[#c8a24a] text-black"
                : "text-white/60 hover:text-white",
            )}
          >
            <Download className="size-3.5" />
            Download
          </button>
        </div>
        <Button
          className="mt-3 h-10 w-full bg-[#e31837] text-white hover:bg-[#c4142f]"
          disabled={assets.length === 0}
          onClick={go}
        >
          Go
        </Button>
        {latest && latest.status !== "complete" && latest.status !== "failed" && (
          <p className="mt-2 text-center text-[11px] text-[#c8a24a]">
            Live · {statusLabel(latest.status)}
          </p>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/40">{label}</dt>
      <dd className="truncate text-right text-white/80 capitalize">{value}</dd>
    </div>
  );
}

function summarize(assets: Asset[]) {
  const teams = new Set(assets.map((a) => a.teamId).filter(Boolean));
  const kinds = new Set(assets.map((a) => a.kind));
  return `${kinds.size} type${kinds.size === 1 ? "" : "s"} · ${teams.size || "mixed"} team folder${teams.size === 1 ? "" : "s"}`;
}
