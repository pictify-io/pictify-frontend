/*
 * Adapted for Pictify from openvideodev/react-video-editor —
 * src/components/editor/media-panel/panel/images.tsx + videos.tsx +
 * upload-modal.tsx. License: OpenVideo License (free tier, accepted
 * 2026-07-27) — see LICENSE at the root of this directory. Local changes:
 * the Pexels stock-media browser is replaced by the user's own uploads
 * (Pictify media upload via the host uploadMedia callback); clip-add payloads
 * kept from upstream; shadcn UI replaced by ./ui; click-to-add.
 */
import { useRef, useState } from "react";
import { core, getHostCallbacks } from "../runtime";
import { ScrollArea } from "../ui";
import { RiImage2Line, RiUploadCloud2Line, RiVideoLine } from "../icons";
import { useMediaLibrary, kindForFile, MediaItem } from "../media-store";

let mediaIdCounter = 0;

export default function PanelMedia() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  // Select the stable array, filter during render (a selector that filters
  // would return a fresh array every getSnapshot → React infinite loop).
  const allItems = useMediaLibrary((s) => s.items);
  const addItem = useMediaLibrary((s) => s.addItem);
  const items = allItems.filter((i) => i.kind !== "audio");

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const kind = kindForFile(file);
        if (!kind || kind === "audio") continue;
        const upload = getHostCallbacks().uploadMedia;
        let url = "";
        let persistent = false;
        if (upload) {
          const result = await upload(file);
          url = result.url;
          persistent = result.persistent;
        } else {
          url = URL.createObjectURL(file);
        }
        addItem({
          id: `media_${Date.now()}_${mediaIdCounter++}`,
          kind,
          name: file.name,
          url,
          persistent,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addItemToCanvas = async (item: MediaItem) => {
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
  };

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
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <RiImage2Line size={28} className="opacity-50" />
            <span className="text-xs">No media yet — upload to begin</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pb-4">
            {items.map((item) => (
              <button
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded border border-border bg-muted/60 transition-colors hover:border-primary/50"
                onClick={() => addItemToCanvas(item)}
                title={`Add ${item.name}`}
              >
                {item.kind === "image" ? (
                  <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                    <RiVideoLine size={22} />
                    <span className="text-[9px] uppercase tracking-wider">Video</span>
                  </div>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-[9px] text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                  {item.name}
                </span>
                {!item.persistent && (
                  <span
                    className="absolute right-1 top-1 rounded bg-black/70 px-1 text-[8px] font-bold uppercase text-yellow-300"
                    title="Stored in this browser session only"
                  >
                    local
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
