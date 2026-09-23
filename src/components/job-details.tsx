"use client";

import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Asset } from "@/lib/types";
import { useState } from "react";

const checker = {
  backgroundColor: "#161616",
  backgroundImage:
    "linear-gradient(45deg,#2c2c2c 25%,transparent 25%),linear-gradient(-45deg,#2c2c2c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2c2c2c 75%),linear-gradient(-45deg,transparent 75%,#2c2c2c 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
} as const;

export function JobDetails() {
  const { selectedIds, getAsset, mode, setMode, submitJob, jobs, view } = useStore();
  const [busy, setBusy] = useState(false);
  const assets = selectedIds.map((id) => getAsset(id)).filter((asset): asset is Asset => Boolean(asset));
  const canSubmit = view === "upload" && assets.length > 0 && !busy;
  const results = jobs.filter(
    (job) => job.status === "complete" && job.mode === "process" && job.outputs.some((out) => out.processedKey),
  );

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await submitJob(assets.map((asset) => asset.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      data-testid="job-details"
      className="flex w-full shrink-0 flex-col border-t border-white/10 bg-[#0c0c0e] lg:w-[320px] lg:border-t-0 lg:border-l"
    >
      <div className="border-b border-white/10 px-4 py-4">
        <h2 className="text-sm font-medium text-white">Job Details</h2>
        <p className="mt-1 text-xs text-white/45">{summary(assets.length)}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-1 rounded-md bg-black p-1">
          <button
            type="button"
            data-testid="process-mode"
            onClick={() => setMode("process")}
            className={cn(
              "rounded px-2 py-2 text-xs font-medium",
              mode === "process" ? "bg-white text-black" : "text-white/60 hover:text-white",
            )}
          >
            Process
          </button>
          <button
            type="button"
            data-testid="download-mode"
            onClick={() => setMode("download")}
            className={cn(
              "rounded px-2 py-2 text-xs font-medium",
              mode === "download" ? "bg-white text-black" : "text-white/60 hover:text-white",
            )}
          >
            Download
          </button>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-white">Headshots</p>
            <p id="headshots-note" className="mt-1 text-[11px] leading-relaxed text-white/40">
              Not available. Headshot formatting has not been verified.
            </p>
          </div>
          <Switch checked={false} disabled aria-label="Headshots" aria-describedby="headshots-note" />
        </div>
        <div>
          <p className="text-[11px] tracking-[0.14em] text-white/35 uppercase">Model</p>
          <p className="mt-1 text-sm text-white">local cutout</p>
          <p className="mt-1 text-[11px] text-white/40">adobe-v2 is not connected</p>
        </div>
        <p className="text-xs leading-relaxed text-white/60">
          {mode === "process"
            ? "Background removal on every selected image."
            : "Original files, full resolution, no processing."}
        </p>
        <Selection assets={assets} />
        {mode === "process" && assets.length > 0 && (
          <Results assets={assets} jobs={results} />
        )}
      </div>
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          data-testid="submit-job"
          disabled={!canSubmit}
          onClick={() => void submit()}
          className="h-10 w-full rounded-md bg-white text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
        >
          {busy ? "Submitting…" : mode === "process" ? "Process images" : "Download originals"}
        </button>
        {view !== "upload" && (
          <p className="mt-2 text-center text-[11px] text-white/35">Choose Local Ingest to submit a job.</p>
        )}
      </div>
    </aside>
  );
}

function summary(count: number) {
  if (count === 0) return "Nothing selected";
  if (count === 1) return "One image";
  return `${count} images`;
}

function Selection({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return <p className="text-xs text-white/35">Nothing selected</p>;
  }
  if (assets.length === 1) {
    const asset = assets[0];
    return (
      <div>
        <p className="truncate text-sm text-white">{asset.name}</p>
        <p className="mt-1 text-[11px] text-white/40">
          {asset.width}×{asset.height}
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-white">{assets.length} images</p>
      <ul className="mt-2 space-y-1">
        {assets.slice(0, 8).map((asset) => (
          <li key={asset.id} className="truncate text-xs text-white/60">
            {asset.name}
          </li>
        ))}
        {assets.length > 8 && <li className="text-xs text-white/35">+{assets.length - 8} more</li>}
      </ul>
    </div>
  );
}

function Results({
  assets,
  jobs,
}: {
  assets: Asset[];
  jobs: { createdAt: number; outputs: { assetId: string; processedKey?: string }[] }[];
}) {
  const ready = assets.flatMap((asset) => {
    const job = jobs.find((item) => item.outputs.some((out) => out.assetId === asset.id && out.processedKey));
    return job ? [{ asset, at: job.createdAt }] : [];
  });
  if (ready.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] tracking-[0.14em] text-white/35 uppercase">Result</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {ready.map(({ asset, at }) => (
          <figure key={asset.id} className="overflow-hidden rounded border border-white/10" style={checker}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/assets/${asset.id}/file?variant=processed&t=${at}`}
              alt={`Background removed: ${asset.name}`}
              className="aspect-square w-full object-contain"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
