"use client";

import { AssetGrid } from "@/components/asset-grid";
import { Inspector } from "@/components/inspector";
import { useStore } from "@/lib/store";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

export function UploadView() {
  const { localAssets, addLocalFiles } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(files: FileList | File[]) {
    addLocalFiles(Array.from(files));
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#c8a24a] uppercase">
            Local upload
          </p>
          <p className="mt-1 text-[11px] text-white/45">
            Stills or movie files. Movies convert to a sequence, then the same cutout pipeline.
          </p>
        </div>
        <div
          className={`m-4 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center ${
            over ? "border-[#c8a24a] bg-[#c8a24a]/10" : "border-white/15 bg-black/20"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (e.dataTransfer.files.length) take(e.dataTransfer.files);
          }}
        >
          <Upload className="size-8 text-[#c8a24a]" />
          <p className="mt-3 text-sm text-white">Drop files from your desktop</p>
          <p className="mt-1 text-xs text-white/45">JPG, PNG, TIFF, MP4, MOV</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && take(e.target.files)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AssetGrid assets={localAssets} />
        </div>
      </div>
      <Inspector />
    </div>
  );
}
