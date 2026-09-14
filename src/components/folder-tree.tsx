"use client";

import { childrenOf, folderById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronRight, Folder, UserRound } from "lucide-react";
import { useState } from "react";

export function FolderTree() {
  return (
    <div className="px-2 py-2">
      <TreeNode id="root" depth={0} />
    </div>
  );
}

function TreeNode({ id, depth }: { id: string; depth: number }) {
  const folder = folderById(id);
  const kids = childrenOf(id);
  const { folderId, setFolderId, showHeadshotBadges } = useStore();
  const [open, setOpen] = useState(depth < 2);
  if (!folder) return null;
  const active = folderId === id;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setFolderId(id);
          if (kids.length) setOpen(true);
        }}
        className={cn(
          "flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left text-[13px]",
          active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {kids.length ? (
          <ChevronRight
            className={cn("size-3.5 shrink-0 transition", open && "rotate-90")}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          />
        ) : (
          <span className="inline-block w-3.5" />
        )}
        <Folder className="size-3.5 shrink-0 text-[#c8a24a]" />
        <span className="min-w-0 truncate">{folder.name}</span>
        {showHeadshotBadges && folder.headshotWorkflow && (
          <UserRound className="ml-auto size-3.5 shrink-0 text-[#69BE28]" />
        )}
      </button>
      {open && kids.map((c) => <TreeNode key={c.id} id={c.id} depth={depth + 1} />)}
    </div>
  );
}
