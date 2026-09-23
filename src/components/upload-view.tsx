"use client";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

function bytesLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadView() {
  const { localAssets, addLocalFiles, selectedIds, toggleSelected, selectMany, clearSelection } =
    useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    void addLocalFiles(list);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-[11px] tracking-[0.18em] text-white/40 uppercase">Local Ingest</p>
        <h2 className="mt-1 text-lg font-medium text-white">Images on this computer</h2>
      </div>
      <label
        data-testid="dropzone"
        className={cn(
          "mx-5 mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center",
          over ? "border-white/70 bg-white/10" : "border-white/20 bg-white/[0.03]",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          if (event.dataTransfer.files.length) take(event.dataTransfer.files);
        }}
      >
        <p className="text-sm text-white">Drag and drop images here, or click to select files</p>
        <p className="mt-1 text-xs text-white/45">JPEG, PNG, WebP, GIF, or TIFF. One job can hold many files.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/tiff,.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) take(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {localAssets.length > 0 && (
        <div className="mt-4 flex items-center justify-between px-5 text-xs text-white/45">
          <span>
            {selectedIds.length} of {localAssets.length} selected
          </span>
          <span className="flex gap-3">
            <button type="button" className="hover:text-white" onClick={() => selectMany(localAssets.map((asset) => asset.id))}>
              Select all
            </button>
            <button type="button" className="hover:text-white" onClick={clearSelection}>
              Clear
            </button>
          </span>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {localAssets.length === 0 ? (
          <p className="text-sm text-white/35">No images yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {localAssets.map((asset) => {
              const on = selectedIds.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  data-testid="local-image"
                  aria-pressed={on}
                  onClick={() => toggleSelected(asset.id)}
                  className={cn(
                    "overflow-hidden rounded-md border text-left",
                    on ? "border-white ring-1 ring-white" : "border-white/10 hover:border-white/30",
                  )}
                >
                  <div className="aspect-[4/5] bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/assets/${asset.id}/file`}
                      alt={asset.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="px-2 py-2">
                    <p className="truncate text-xs text-white">{asset.name}</p>
                    <p className="text-[10px] text-white/40">
                      {asset.width}×{asset.height} · {bytesLabel(asset.bytes)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
