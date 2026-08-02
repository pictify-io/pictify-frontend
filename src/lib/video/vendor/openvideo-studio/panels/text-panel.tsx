/*
 * Vendored from openvideodev/react-video-editor — src/components/editor/media-panel/panel/text.tsx
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased onto this
 * vendor directory; shadcn ScrollArea replaced by ./ui; the shared Draggable
 * wrapper dropped (click-to-add only); presets deep-cloned before adding so
 * the shared preset objects are never mutated by the engine; preview images
 * fall back to styled text when the upstream CDN 404s.
 */
import { useState } from "react";
import { core } from "../runtime";
import { ScrollArea } from "../ui";
import { TEXT_PRESETS } from "../text-presets";

function PresetPreview({ preset }: { preset: (typeof TEXT_PRESETS)[number] }) {
  const previewUrl = (preset as any).metadata?.previewUrl;
  const [failed, setFailed] = useState(false);

  if (previewUrl && !failed) {
    return (
      <img
        src={previewUrl}
        alt={preset.name}
        onError={() => setFailed(true)}
        className="pointer-events-none max-h-full max-w-full object-contain"
      />
    );
  }
  return (
    <span
      className="line-clamp-2 break-words text-center"
      style={{
        fontSize: preset.name === "Heading" ? 18 : preset.name === "Body" ? 11 : 14,
        fontWeight: preset.name === "Body" ? 400 : 700,
        color: preset.style.color,
        backgroundColor: (preset.style as any).background?.color,
        padding: (preset.style as any).background ? "2px 8px" : undefined,
      }}
    >
      {preset.text}
    </span>
  );
}

export default function PanelText() {
  const handleAddText = (preset?: (typeof TEXT_PRESETS)[number]) => {
    try {
      const activePreset = preset || TEXT_PRESETS[0];
      const payload = JSON.parse(
        JSON.stringify({
          type: activePreset.type,
          name: activePreset.name,
          text: activePreset.text,
          style: activePreset.style,
          timing: activePreset.timing,
          transform: activePreset.transform,
        })
      );
      core.clip.add(payload);
    } catch (error) {
      console.error("Failed to add text:", error);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden py-3">
      <div className="px-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Text
        </span>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="grid grid-cols-2 gap-2 pb-4">
          {TEXT_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => handleAddText(preset)}
              className="group relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded border border-border bg-muted/60 p-2 transition-colors hover:border-primary/50 hover:bg-accent"
              title={`Add ${preset.name}`}
            >
              <PresetPreview preset={preset} />
              <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wider text-white/80 opacity-0 transition-opacity group-hover:opacity-100">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
