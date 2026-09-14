"use client";

import { AssetGrid } from "@/components/asset-grid";
import { FolderTree } from "@/components/folder-tree";
import { Inspector } from "@/components/inspector";
import { assetsInFolder, folderById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function PhotoShelterView() {
  const { folderId, selectMany, showHeadshotBadges, setShowHeadshotBadges } =
    useStore();
  const folder = folderById(folderId);
  const assets = assetsInFolder(folderId);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#0e1218]">
        <div className="border-b border-white/10 px-3 py-3">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#c8a24a] uppercase">
            Photo Shelter
          </p>
          <p className="mt-1 text-[11px] leading-snug text-white/45">
            Ben Lieppman account · AP Images ingest
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FolderTree />
        </div>
        <label className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-3 text-[11px] text-white/60">
          Headshot badges
          <Switch
            checked={showHeadshotBadges}
            onCheckedChange={setShowHeadshotBadges}
          />
        </label>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <div>
            <h2 className="text-sm font-semibold text-white">{folder?.name}</h2>
            <p className="text-[11px] text-white/45">
              {assets.length} item{assets.length === 1 ? "" : "s"} · Finder
            </p>
          </div>
          {assets.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 bg-transparent text-white hover:bg-white/10"
              onClick={() => selectMany(assets.map((a) => a.id))}
            >
              Select all
            </Button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AssetGrid assets={assets} />
        </div>
      </div>
      <Inspector />
    </div>
  );
}
