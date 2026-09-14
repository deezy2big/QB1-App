"use client";

import { statusLabel } from "@/lib/pipeline";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/types";

const ORDER: JobStatus[] = [
  "queued",
  "transferring",
  "sequencing",
  "cutting_out",
  "aligning",
  "complete",
];

export function JobsView() {
  const { jobs, getAsset } = useStore();

  if (jobs.length === 0) {
    return (
      <div className="flex w-full flex-1 items-center justify-center text-sm text-white/40">
        No jobs yet. Process or download from Photo Shelter, AP Images, or Local.
      </div>
    );
  }

  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto p-6">
      <p className="text-[11px] font-medium tracking-[0.16em] text-[#c8a24a] uppercase">
        Live jobs · status stream
      </p>
      <div className="mt-4 space-y-4">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="rounded-lg border border-white/10 bg-[#10141c] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {job.mode === "process" ? "Process" : "Download"} · {job.assetIds.length}{" "}
                  asset{job.assetIds.length === 1 ? "" : "s"}
                </h3>
                <p className="text-[11px] text-white/45">
                  {job.submittedBy} · {job.office} · {new Date(job.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  job.status === "complete" && "bg-emerald-500/15 text-emerald-300",
                  job.status === "failed" && "bg-red-500/15 text-red-300",
                  job.status !== "complete" &&
                    job.status !== "failed" &&
                    "bg-[#c8a24a]/15 text-[#c8a24a]",
                )}
              >
                {statusLabel(job.status)}
              </span>
            </div>
            <ol className="mt-3 flex flex-wrap gap-1.5">
              {ORDER.filter((s) =>
                job.events.some((e) => e.status === s) || s === job.status,
              ).map((s) => (
                <li
                  key={s}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] uppercase tracking-wide",
                    s === job.status ? "bg-white/15 text-white" : "bg-white/5 text-white/40",
                  )}
                >
                  {statusLabel(s)}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[12px] text-white/55">
              {job.assetIds
                .map((id) => getAsset(id)?.player ?? getAsset(id)?.name)
                .filter(Boolean)
                .slice(0, 6)
                .join(" · ")}
            </p>
            <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 font-mono text-[11px] text-white/50">
              {job.events.map((e, i) => (
                <li key={i}>
                  <span className="text-white/30">
                    {new Date(e.at).toLocaleTimeString()}
                  </span>{" "}
                  {e.message}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
