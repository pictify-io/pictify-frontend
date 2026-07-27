/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/media-panel/panel/elements.tsx + src/lib/shape-utils.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: backdrop elements dropped (the
 * engine's ShapeType is "rectangle" only); rectangle variants (square,
 * rounded, circle via borderRadius) added; positions target the default
 * 1080x1920 composition; shadcn UI replaced by ./ui.
 */
import { generateId } from "@openvideo/core";
import { core } from "../runtime";

interface ShapePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  borderRadius?: number;
  fill: string;
}

const SHAPES: ShapePreset[] = [
  { id: "rectangle", name: "Rectangle", width: 480, height: 300, fill: "#facc15" },
  { id: "square", name: "Square", width: 360, height: 360, fill: "#3b82f6" },
  { id: "rounded", name: "Rounded", width: 480, height: 300, borderRadius: 48, fill: "#a855f7" },
  { id: "circle", name: "Circle", width: 360, height: 360, borderRadius: 180, fill: "#10b981" },
];

function createShapeClip(preset: ShapePreset) {
  const duration = 5000000; // 5 seconds default duration
  return {
    id: generateId(),
    type: "Shape",
    name: preset.name,
    shapeType: "rectangle" as const,
    timing: {
      display: { from: 0, to: duration },
      trim: { from: 0, to: duration },
      duration,
      playbackRate: 1,
    },
    transform: {
      x: (1080 - preset.width) / 2,
      y: (1920 - preset.height) / 2,
      width: preset.width,
      height: preset.height,
      angle: 0,
      opacity: 1,
      zIndex: 1,
    },
    style: {
      fill: preset.fill,
      fillOpacity: 1,
      stroke: { color: "#000000", width: 0 },
      borderRadius: preset.borderRadius,
    },
    src: "shape://rectangle",
    metadata: {},
    locked: false,
  };
}

export default function PanelShapes() {
  const handleAddShape = (preset: ShapePreset) => {
    try {
      core.clip.add(createShapeClip(preset) as any);
    } catch (error) {
      console.error("Failed to add shape:", error);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden py-3">
      <div className="px-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Shapes
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3">
        {SHAPES.map((shape) => (
          <button
            key={shape.id}
            onClick={() => handleAddShape(shape)}
            className="group flex aspect-square w-full flex-col items-center justify-center gap-2 rounded border border-border bg-muted/60 transition-colors hover:border-primary/50 hover:bg-accent"
            title={`Add ${shape.name}`}
          >
            <span
              className="block h-10 w-14"
              style={{
                backgroundColor: shape.fill,
                borderRadius:
                  shape.id === "circle"
                    ? "9999px"
                    : shape.borderRadius != null
                      ? `${shape.borderRadius / 4}px`
                      : undefined,
                width: shape.width === shape.height ? 40 : 56,
              }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
              {shape.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
