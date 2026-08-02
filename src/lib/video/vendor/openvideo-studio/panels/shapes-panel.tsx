/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/media-panel/panel/elements.tsx + src/lib/shape-utils.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: rectangle variants (square,
 * rounded, circle via borderRadius) added; positions target the default
 * 1080x1920 composition; shadcn UI replaced by ./ui; a Gradients section
 * added.
 *
 * Backdrop clips are BACK (an earlier pass dropped them). They are the only
 * primitive in this engine that can render a gradient — a Shape's style.fill
 * must stay a hex string or the whole render fails — so gradient backgrounds
 * and gradient rectangles are both authored here as Backdrops.
 */
import { generateId } from "@openvideo/core";
import { core } from "../runtime";
import { ScrollArea } from "../ui";
import {
  GRADIENT_PRESETS,
  createGradientClip,
  gradientCss,
} from "../../../gradients";

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

  // Gradients must be added through core.clip.add: BackdropClip needs the
  // renderer injected by the engine, and hydrating one any other way throws
  // "BackdropClip: No renderer available".
  const handleAddGradient = (preset: (typeof GRADIENT_PRESETS)[number], fullBleed: boolean) => {
    try {
      const settings = (core.store.getState() as any).settings || {};
      core.clip.add(
        createGradientClip(
          preset,
          {
            width: settings.width || 1080,
            height: settings.height || 1920,
            durationUs: settings.duration || 5000000,
          },
          { fullBleed }
        ) as any
      );
    } catch (error) {
      console.error("Failed to add gradient:", error);
    }
  };

  return (
    // Matches the Text / Media / Audio panels: a fixed header, then a
    // ScrollArea. The previous version had overflow-hidden and NO scroller, so
    // anything past the first screenful of a 256px drawer was clipped and
    // unreachable — which is why the Gradients section was invisible.
    <div className="flex h-full flex-col gap-3 overflow-hidden py-3">
      <div className="shrink-0 px-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Shapes &amp; Gradients
        </span>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="grid grid-cols-2 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              onClick={() => handleAddShape(shape)}
              className="group flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded border border-border bg-muted/60 transition-colors hover:border-primary/50 hover:bg-accent"
              title={`Add ${shape.name}`}
            >
              <span
                className="block h-8"
                style={{
                  backgroundColor: shape.fill,
                  borderRadius:
                    shape.id === "circle"
                      ? "9999px"
                      : shape.borderRadius != null
                        ? `${shape.borderRadius / 4}px`
                        : undefined,
                  width: shape.width === shape.height ? 32 : 48,
                }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                {shape.name}
              </span>
            </button>
          ))}
        </div>

        <div className="pt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Gradients
          </span>
          <p className="mt-1 text-[10px] font-medium leading-snug text-muted-foreground/80">
            Click for a full-screen background. Shift-click for a panel you can move and resize.
          </p>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 pb-3">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={(event) => handleAddGradient(preset, !event.shiftKey)}
              className="group flex w-full flex-col items-center justify-center gap-1.5 rounded border border-border bg-muted/60 p-2 transition-colors hover:border-primary/50 hover:bg-accent"
              title={`Add ${preset.name} gradient — shift-click for a panel`}
            >
              <span
                className="block h-8 w-full rounded-sm"
                style={{
                  backgroundImage: gradientCss({
                    type: "linear",
                    angle: preset.angle,
                    colors: preset.colors,
                  }),
                  // The scrim fades to transparent — show it over a mid grey so
                  // the swatch doesn't read as half-empty.
                  backgroundColor: preset.id === "scrim" ? "#4b5563" : undefined,
                }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
