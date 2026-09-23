"use client";

import type { ReactNode } from "react";
import { AccountNotice } from "@/components/account-notice";
import { JobDetails } from "@/components/job-details";
import { JobStrip } from "@/components/job-strip";
import { UploadView } from "@/components/upload-view";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/lib/types";

const NAV: { id: ViewId; label: string }[] = [
  { id: "analytics", label: "Analytics" },
  { id: "upload", label: "Local Ingest" },
  { id: "photoshelter", label: "PhotoShelter Ingest" },
  { id: "ap", label: "Associated Press Ingest" },
];

export function Qb1Shell() {
  const { view, setView, operatorName, setOperatorName } = useStore();
  const ingest = view === "upload" || view === "photoshelter" || view === "ap";

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#070708] text-white">
      <header className="flex shrink-0 items-center gap-4 border-b border-white/10 px-4 py-3">
        <div className="shrink-0 pr-2">
          <p className="text-[15px] font-semibold tracking-tight">qb1</p>
          <p className="text-[10px] text-white/40">Your starter for every creative play</p>
        </div>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Primary">
          <NavButton active={view === "analytics"} onClick={() => setView("analytics")}>
            Analytics
          </NavButton>
          <span
            className="cursor-not-allowed rounded-md px-2.5 py-1.5 text-xs text-white/30"
            title="Planned"
          >
            Jersey Swap
            <span className="ml-1 text-[10px] uppercase">Planned</span>
          </span>
          <span
            className="cursor-not-allowed rounded-md px-2.5 py-1.5 text-xs text-white/30"
            title="Planned"
          >
            Image Crop
            <span className="ml-1 text-[10px] uppercase">Planned</span>
          </span>
          {NAV.filter((item) => item.id !== "analytics").map((item) => (
            <NavButton key={item.id} active={view === item.id} onClick={() => setView(item.id)}>
              {item.label}
            </NavButton>
          ))}
        </nav>
        <label className="hidden shrink-0 text-[10px] text-white/40 sm:block">
          Submitted by
          <input
            value={operatorName}
            onChange={(event) => setOperatorName(event.target.value)}
            onBlur={() => {
              if (!operatorName.trim()) setOperatorName("Local operator");
            }}
            className="mt-1 block w-36 rounded border border-white/15 bg-black px-2 py-1 text-xs text-white"
            aria-label="Submitted by"
            suppressHydrationWarning
          />
        </label>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {view === "upload" && <UploadView />}
          {view === "photoshelter" && <AccountNotice kind="photoshelter" />}
          {view === "ap" && <AccountNotice kind="ap" />}
          {view === "analytics" && <AccountNotice kind="analytics" />}
        </div>
        {ingest && <JobDetails />}
      </div>
      <JobStrip />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md px-2.5 py-1.5 text-xs",
        active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
