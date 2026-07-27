/*
 * Adapted for Pictify from openvideodev/react-video-editor —
 * src/components/editor/media-panel/panel/music.tsx. License: OpenVideo
 * License (free tier, accepted 2026-07-27) — see LICENSE at the root of this
 * directory. Local changes: the stock-music browser is replaced by the
 * user's own audio uploads (host uploadMedia callback); clip-add payload kept
 * from upstream; shadcn UI replaced by ./ui; click-to-add.
 */
import { useRef, useState } from "react";
import { core, getHostCallbacks } from "../runtime";
import { ScrollArea } from "../ui";
import { RiMusic2Line, RiUploadCloud2Line } from "../icons";
import { useMediaLibrary, kindForFile, MediaItem } from "../media-store";

let audioIdCounter = 0;

export default function PanelAudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  // Select the stable array, filter during render (a selector that filters
  // would return a fresh array every getSnapshot → React infinite loop).
  const allItems = useMediaLibrary((s) => s.items);
  const addItem = useMediaLibrary((s) => s.addItem);
  const items = allItems.filter((i) => i.kind === "audio");

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (kindForFile(file) !== "audio") continue;
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
          id: `audio_${Date.now()}_${audioIdCounter++}`,
          kind: "audio",
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
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <RiMusic2Line size={28} className="opacity-50" />
            <span className="text-xs">No audio yet — upload a track</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pb-4">
            {items.map((item) => (
              <button
                key={item.id}
                className="group flex items-center gap-2 rounded border border-border bg-muted/60 px-2 py-2 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                onClick={() => addItemToTimeline(item)}
                title={`Add ${item.name}`}
              >
                <RiMusic2Line size={16} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{item.name}</span>
                {!item.persistent && (
                  <span
                    className="rounded bg-black/50 px-1 text-[8px] font-bold uppercase text-yellow-300"
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
