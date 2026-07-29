/*
 * Adapted for Pictify from openvideodev/react-video-editor —
 * src/components/editor/media-panel/panel/images.tsx + videos.tsx +
 * upload-modal.tsx. License: OpenVideo License (free tier, accepted
 * 2026-07-27) — see LICENSE at the root of this directory. Local changes:
 * the Pexels stock-media browser is replaced by the user's own library
 * (brand images + uploaded footage, see use-media-library); clip-add payloads
 * kept from upstream; shadcn UI replaced by ./ui; click-to-add; remove.
 */
import { useCallback, useRef } from "react";
import { core } from "../runtime";
import { ScrollArea } from "../ui";
import { RiImage2Line, RiUploadCloud2Line, RiVideoLine, RiDeleteBinLine } from "../icons";
import { useMediaLibrary, MediaItem, MediaKind, formatBytes } from "../media-store";
import { useMediaHydration, useMediaUpload, useMediaRemove } from "../use-media-library";

const acceptsVisual = (kind: MediaKind) => kind !== "audio";

export default function PanelMedia() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading, error: loadError } = useMediaHydration();
  const { upload, isUploading, error: uploadError } = useMediaUpload(acceptsVisual);
  const { remove, error: removeError } = useMediaRemove();
  // Select the stable array, filter during render (a selector that filters
  // would return a fresh array every getSnapshot → React infinite loop).
  const allItems = useMediaLibrary((s) => s.items);
  const items = allItems.filter((i) => i.kind !== "audio");
  const error = uploadError || removeError || loadError;

  const handleFiles = async (files: FileList | null) => {
    await upload(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const addItemToCanvas = useCallback(async (item: MediaItem) => {
    try {
      if (item.kind === "image") {
        await core.clip.add(
          {
            type: "Image",
            src: item.url,
            name: item.name,
            timing: { display: { from: 0, to: 5_000_000 } },
          },
          { objectFit: "contain" }
        );
      } else {
        await core.clip.add({ type: "Video", src: item.url, name: item.name }, {
          objectFit: "contain",
        });
      }
    } catch (err) {
      console.error("Failed to add media:", err);
    }
  }, []);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden py-3">
      <div className="flex items-center justify-between px-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Media
        </span>
      </div>
      <div className="px-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
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
          {isUploading ? "Uploading…" : "Upload image or video"}
        </button>
        {error && <p className="mt-1.5 text-[11px] text-destructive">{error}</p>}
      </div>

      <ScrollArea className="flex-1 px-3">
        {loading ? (
          // Skeletons rather than a spinner: the grid keeps its shape, so the
          // panel doesn't jump when the real thumbnails land.
          <div className="grid grid-cols-2 gap-2 pb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded border border-border bg-muted/60"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <RiImage2Line size={28} className="opacity-50" />
            <span className="text-xs">No media yet — upload to begin</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pb-4">
            {items.map((item) => (
              // A button inside a button is invalid HTML and the inner one
              // never fires, so the tile is a div with an explicit role and the
              // remove control sits as a real sibling button.
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded border border-border bg-muted/60 transition-colors hover:border-primary/50"
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="h-full w-full cursor-pointer"
                  onClick={() => addItemToCanvas(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      addItemToCanvas(item);
                    }
                  }}
                  title={`Add ${item.name}`}
                >
                  {item.kind === "image" ? (
                    <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      {/* Behind the video, not swapped in on error: a codec the
                          browser won't decode fires no error event, it just
                          paints nothing. Layering means the tile is never a
                          blank box whatever the file does. */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
                        <RiVideoLine size={22} />
                        <span className="text-[9px] uppercase tracking-wider">Video</span>
                      </div>
                      <video
                        src={item.url}
                        className="relative h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        // A still frame beats a generic film icon for telling
                        // two clips apart. 0.1s in, because seeking to exactly
                        // 0 shows black on anything that opens on a fade.
                        onLoadedMetadata={(e) => {
                          const el = e.currentTarget;
                          if (el.currentTime === 0) el.currentTime = 0.1;
                        }}
                      />
                    </>
                  )}
                  {item.kind === "video" && (
                    <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/70 p-0.5 text-white/90">
                      <RiVideoLine size={12} />
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[9px] text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                    {item.name}
                    {item.bytes ? ` · ${formatBytes(item.bytes)}` : ""}
                  </span>
                </div>

                {!item.persistent && (
                  <span
                    className="pointer-events-none absolute right-1 top-1 rounded bg-black/70 px-1 text-[8px] font-bold uppercase text-yellow-300"
                    title="This upload failed — the file works while this tab is open, but not after a reload or in an export"
                  >
                    local
                  </span>
                )}

                {/* Brand assets are shown here but removed from the brand kit,
                    not from a video editor — deleting your logo mid-edit is
                    never what you meant. */}
                {item.persistent && item.source !== "brand" && (
                  <button
                    className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white/80 opacity-0 transition-opacity hover:bg-destructive hover:text-white focus:opacity-100 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(item);
                    }}
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
