"use client";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";
import { useEffect, useState } from "react";

function sourceLabel(job: Job) {
  if (job.source === "photoshelter") return "PhotoShelter";
  if (job.source === "ap") return "Associated Press";
  return "Local";
}

function stripStatus(job: Job) {
  if (job.status === "failed") return "Failed";
  if (job.status === "queued") return "Queued";
  if (job.status === "complete") {
    return job.mode === "download" ? "Download ready" : "Processing complete";
  }
  return "Working";
}

function when(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function JobStrip() {
  const { jobs, getAsset } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = jobs.find((job) => job.id === openId) ?? null;

  useEffect(() => {
    if (!openId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <>
      <footer
        data-testid="job-strip"
        aria-live="polite"
        className="flex h-[76px] shrink-0 items-stretch gap-2 overflow-x-auto border-t border-white/10 bg-[#09090b] px-3 py-2"
      >
        {jobs.length === 0 ? (
          <p className="self-center text-xs text-white/35">No jobs yet.</p>
        ) : (
          jobs.map((job) => (
            <article
              key={job.id}
              data-testid="job-row"
              className="flex min-w-[280px] flex-1 items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] text-white/80">
                  {when(job.createdAt)} · {job.submittedBy} · {sourceLabel(job)}
                </p>
                <p className="truncate font-mono text-[10px] text-white/40" title={job.id}>
                  {job.id} · {job.assetIds.length} image{job.assetIds.length === 1 ? "" : "s"}
                </p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-[11px]",
                  job.status === "failed" ? "text-red-300" : "text-white",
                )}
              >
                {stripStatus(job)}
              </p>
              {job.status === "complete" && (
                <a
                  data-testid="job-download"
                  href={`/api/jobs/${job.id}/download`}
                  className="shrink-0 rounded bg-white px-2 py-1 text-[11px] font-medium text-black"
                >
                  Download
                </a>
              )}
              <button
                type="button"
                data-testid="view-details"
                className="shrink-0 text-[11px] text-white/60 underline-offset-2 hover:text-white hover:underline"
                onClick={() => setOpenId(job.id)}
              >
                View Details
              </button>
            </article>
          ))
        )}
      </footer>
      {open && (
        <dialog open className="fixed inset-0 z-20 m-0 flex h-full w-full items-center justify-center bg-black/70 p-4" onClick={() => setOpenId(null)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-white/15 bg-[#101012] p-5 text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">Job {open.id}</h3>
                <p className="mt-1 text-xs text-white/50">
                  {when(open.createdAt)} · {open.submittedBy} · {sourceLabel(open)} · {stripStatus(open)}
                </p>
              </div>
              <button type="button" className="text-xs text-white/50 hover:text-white" onClick={() => setOpenId(null)}>
                Close
              </button>
            </div>
            {open.error && <p className="mt-3 text-sm text-red-300">{open.error}</p>}
            <ul className="mt-4 space-y-1 text-xs text-white/55">
              {open.events.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  {new Date(event.at).toLocaleTimeString()} · {event.message}
                </li>
              ))}
            </ul>
            {open.status === "complete" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {open.outputs.map((out) => {
                  const asset = getAsset(out.assetId);
                  const processed = open.mode === "process" && out.processedKey && out.processedKey !== out.originalKey;
                  return (
                    <figure key={out.assetId} className="overflow-hidden rounded border border-white/10 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          processed
                            ? `/api/assets/${out.assetId}/file?job=${open.id}&t=${open.createdAt}`
                            : `/api/assets/${out.assetId}/file`
                        }
                        alt={asset?.name ?? out.assetId}
                        className="aspect-square w-full object-contain"
                        style={
                          processed
                            ? {
                                backgroundColor: "#161616",
                                backgroundImage:
                                  "linear-gradient(45deg,#2c2c2c 25%,transparent 25%),linear-gradient(-45deg,#2c2c2c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2c2c2c 75%),linear-gradient(-45deg,transparent 75%,#2c2c2c 75%)",
                                backgroundSize: "16px 16px",
                                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                              }
                            : undefined
                        }
                      />
                      <figcaption className="truncate px-2 py-1 text-[10px] text-white/50">
                        {asset?.name ?? out.assetId}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            )}
            {open.status === "complete" && (
              <a
                href={`/api/jobs/${open.id}/download`}
                className="mt-4 inline-flex rounded bg-white px-3 py-2 text-xs font-medium text-black"
              >
                Download
              </a>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}
