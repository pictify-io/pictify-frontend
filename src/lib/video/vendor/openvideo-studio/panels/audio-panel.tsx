/*
 * Adapted for Pictify from openvideodev/react-video-editor —
 * src/components/editor/media-panel/panel/music.tsx. License: OpenVideo
 * License (free tier, accepted 2026-07-27) — see LICENSE at the root of this
 * directory. Local changes: the stock-music browser is replaced by the
 * user's own audio library (see use-media-library); clip-add payload kept
 * from upstream; shadcn UI replaced by ./ui; click-to-add; remove.
 */
import { useRef } from "react";
import { core } from "../runtime";
import { ScrollArea } from "../ui";
import { RiMusic2Line, RiUploadCloud2Line, RiDeleteBinLine } from "../icons";
import { useMediaLibrary, MediaItem, MediaKind, formatBytes } from "../media-store";
import { useMediaHydration, useMediaUpload, useMediaRemove } from "../use-media-library";

const acceptsAudio = (kind: MediaKind) => kind === "audio";

export default function PanelAudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading, error: loadError } = useMediaHydration();
  const { upload, isUploading, error: uploadError } = useMediaUpload(acceptsAudio);
  const { remove, error: removeError } = useMediaRemove();
  // Select the stable array, filter during render (a selector that filters
  // would return a fresh array every getSnapshot → React infinite loop).
  const allItems = useMediaLibrary((s) => s.items);
  const items = allItems.filter((i) => i.kind === "audio");
  const error = uploadError || removeError || loadError;

  const handleFiles = async (files: FileList | null) => {
    await upload(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const addItemToTimeline = async (item: MediaItem) => {
    try {
      await core.clip.add({ type: "Audio", src: item.url, name: item.name });
    } catch (err) {
      console.error("Failed to add audio:", err);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden py-3">
      <div className="px-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Audio
        </span>
      </div>
      <div className="px-3">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          className="flex h-9 w-full items-center justify-center gap-2 rounded border border-dashed border-border bg-muted/40 text-xs font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-accent disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <RiUploadCloud2Line size={14} />
          {isUploading ? "Uploading…" : "Upload audio"}
        </button>
        {error && <p className="mt-1.5 text-[11px] text-destructive">{error}</p>}
      </div>

      <ScrollArea className="flex-1 px-3">
        {loading ? (
          <div className="flex flex-col gap-1.5 pb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded border border-border bg-muted/60"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <RiMusic2Line size={28} className="opacity-50" />
            <span className="text-xs">No audio yet — upload a track</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pb-4">
            {items.map((item) => (
              // Row is a div, not a button: the remove control is a real button
              // and nesting one inside another is invalid HTML that never fires.
              <div
                key={item.id}
                className="group flex items-center gap-2 rounded border border-border bg-muted/60 px-2 py-2 transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                  onClick={() => addItemToTimeline(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      addItemToTimeline(item);
                    }
                  }}
                  title={`Add ${item.name}`}
                >
                  <RiMusic2Line size={16} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                    {item.name}
                  </span>
                  {item.bytes ? (
                    <span className="shrink-0 text-[9px] tabular-nums text-muted-foreground">
                      {formatBytes(item.bytes)}
                    </span>
                  ) : null}
                </div>
                {!item.persistent && (
                  <span
                    className="shrink-0 rounded bg-black/50 px-1 text-[8px] font-bold uppercase text-yellow-300"
                    title="This upload failed — the file works while this tab is open, but not after a reload or in an export"
                  >
                    local
                  </span>
                )}
                {item.persistent && item.source !== "brand" && (
                  <button
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                    onClick={() => remove(item)}
                    title={`Remove ${item.name} from your library (videos already using it keep working)`}
                    aria-label={`Remove ${item.name}`}
                  >
                    <RiDeleteBinLine size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
