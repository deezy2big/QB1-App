"use client";

import { Portrait } from "@/lib/portrait";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Asset } from "@/lib/types";
import { Film } from "lucide-react";

export function AssetGrid({ assets }: { assets: Asset[] }) {
  const {
    selectedIds,
    toggleSelected,
    selectOnly,
    queueIds,
    addToQueue,
    removeFromQueue,
    view,
  } = useStore();
  const active = view === "ap" ? queueIds : selectedIds;

  if (assets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/40">
        No images in this folder.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {assets.map((asset) => {
        const on = active.includes(asset.id);
        return (
          <button
            key={asset.id}
            type="button"
            onClick={(e) => {
              if (view === "ap") {
                if (on && (e.metaKey || e.ctrlKey)) removeFromQueue(asset.id);
                else addToQueue([asset.id]);
                return;
              }
              if (e.metaKey || e.ctrlKey || e.shiftKey) toggleSelected(asset.id);
              else selectOnly(asset.id);
            }}
            className={cn(
              "group overflow-hidden rounded-md border text-left transition",
              on
                ? "border-[#c8a24a] ring-1 ring-[#c8a24a]"
                : "border-white/10 hover:border-white/25",
            )}
          >
            <div className="relative aspect-[5/6] bg-[#0b0d12]">
              <Portrait
                name={asset.player ?? asset.name}
                number={asset.number}
                teamId={asset.teamId}
                kind={asset.kind}
              />
              {asset.kind === "movie" && (
                <Film className="absolute top-2 right-2 size-4 text-white/80" />
              )}
            </div>
            <div className="border-t border-white/10 bg-[#121722] px-2 py-1.5">
              <p className="truncate text-[11px] font-medium text-white">
                {asset.player ?? asset.name}
              </p>
              <p className="truncate text-[10px] text-white/45">{asset.kind}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
