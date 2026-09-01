"use client";

import { AnalyticsView } from "@/components/analytics-view";
import { ApImagesView } from "@/components/ap-images-view";
import { JobsView } from "@/components/jobs-view";
import { PhotoShelterView } from "@/components/photo-shelter-view";
import { UploadView } from "@/components/upload-view";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/lib/types";
import {
  BarChart3,
  FolderSearch,
  Images,
  ListTodo,
  LogOut,
  Upload,
} from "lucide-react";

const NAV: { id: ViewId; label: string; icon: typeof Images }[] = [
  { id: "photoshelter", label: "Photo Shelter", icon: FolderSearch },
  { id: "ap", label: "AP Images", icon: Images },
  { id: "upload", label: "Local", icon: Upload },
  { id: "jobs", label: "Jobs", icon: ListTodo },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export function Qb1Shell() {
  const { view, setView, session, logout, jobs, queueIds } = useStore();
  const live = jobs.filter((j) => j.status !== "complete" && j.status !== "failed").length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0d12] text-white">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0e1218] px-3">
        <div className="flex items-center gap-2 pr-3">
          <span className="flex size-7 items-center justify-center rounded bg-[#e31837] text-[11px] font-black tracking-tight">
            Q1
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold">QB1</p>
            <p className="text-[10px] tracking-wide text-white/40 uppercase">
              Media Design · Image processing
            </p>
          </div>
        </div>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const badge =
              item.id === "jobs" && live > 0
                ? live
                : item.id === "ap" && queueIds.length > 0
                  ? queueIds.length
                  : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                  view === item.id
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
                {badge !== null && (
                  <span className="rounded-full bg-[#c8a24a] px-1.5 text-[10px] text-black">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-white/55">
          <span className="hidden sm:inline">
            {session?.name} · {session?.office}
          </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[#c8a24a]">
            Okta
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1">
        {view === "photoshelter" && <PhotoShelterView />}
        {view === "ap" && <ApImagesView />}
        {view === "upload" && <UploadView />}
        {view === "jobs" && <JobsView />}
        {view === "analytics" && <AnalyticsView />}
      </main>
    </div>
  );
}
