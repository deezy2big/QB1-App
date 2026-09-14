"use client";

import { AssetGrid } from "@/components/asset-grid";
import { Inspector } from "@/components/inspector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AP_ASSETS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

const PAGE_SIZE = 12;

export function ApImagesView() {
  const { apQuery, setApQuery, apPage, setApPage } = useStore();

  const filtered = useMemo(() => {
    const q = apQuery.trim().toLowerCase();
    if (!q) return AP_ASSETS;
    return AP_ASSETS.filter((a) =>
      [a.name, a.caption, a.player, a.teamId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [apQuery]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(apPage, pages);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#c8a24a] uppercase">
            AP Images
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              value={apQuery}
              onChange={(e) => setApQuery(e.target.value)}
              placeholder="Search AP Images — try Seattle"
              className="max-w-md border-white/15 bg-black/30 text-white"
            />
            <p className="text-[11px] text-white/45">
              {filtered.length.toLocaleString()} results
              {filtered.length > PAGE_SIZE ? ` · ${pages} pages` : ""}
            </p>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AssetGrid assets={slice} />
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2">
          <p className="text-[11px] text-white/40">
            Selections stay in the right-hand queue as you change pages.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/15 bg-transparent text-white"
              disabled={page <= 1}
              onClick={() => setApPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-white/60">
              {page} / {pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-white/15 bg-transparent text-white"
              disabled={page >= pages}
              onClick={() => setApPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <Inspector />
    </div>
  );
}
