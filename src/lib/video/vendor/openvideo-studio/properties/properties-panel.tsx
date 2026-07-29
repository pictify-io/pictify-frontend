/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/right-panel/{right-panel,properties-panel}.tsx +
 * properties/properties-panel.tsx. License: OpenVideo License (free tier,
 * accepted 2026-07-27) — see LICENSE at the root of this directory.
 * Local changes: imports rebased onto this vendor directory (shared runtime,
 * consolidated ./options, trimmed ./property-registry); caption / effect /
 * transition / scene / animation branches dropped; a clip header with
 * Duplicate + Delete actions added (upstream keeps those in the timeline
 * header); font changes resolve against the vendored font subset via
 * fontManager; a Timing section (written for Pictify) added.
 */
import { useStore } from "zustand";
import { fontManager } from "@openvideo/engine-pixi";
import { core, projectStore, useStudioStore } from "../runtime";
import { Button, ScrollArea, cn } from "../ui";
import { RiDeleteBinLine, RiFileCopyLine } from "../icons";
import { getPropertiesForType, PropertyKey } from "./property-registry";
import { readGradient, gradientStyle } from "../../../gradients";
import { getHostCallbacks } from "../runtime";
import { useEphemeralClip } from "./use-ephemeral-clip";
import { getFontByPostScriptName } from "../font-utils";
import * as Properties from "./options";

function PropertiesPanelContent({ clip }: { clip: any }) {
  const coreClipBase = useStore(projectStore, (s: any) => (clip?.id ? s.clips[clip.id] : null));
  const coreClip = useEphemeralClip(clip?.id || "", coreClipBase ?? clip) as any;

  if (!coreClip) return null;
  const style = coreClip?.style || {};
  const transform = coreClip?.transform || {};

  // Helper getters (ephemeral values win during canvas drags)
  const getX = () => coreClip?.left ?? transform.x ?? 0;
  const getY = () => coreClip?.top ?? transform.y ?? 0;
  const getWidth = () => coreClip?.width ?? transform.width ?? 0;
  const getHeight = () => coreClip?.height ?? transform.height ?? 0;
  const getAngle = () => coreClip?.angle ?? transform.angle ?? 0;
  const getOpacity = () => coreClip?.opacity ?? transform.opacity ?? 1;
  const getVolume = () => coreClip?.volume ?? 1;

  const handleUpdate = (updates: any) => {
    if (clip.id) {
      core.clip.update(clip.id, updates);
    }
  };

  const handleTransformUpdate = (updates: any) => {
    handleUpdate({ transform: { ...transform, ...updates } });
  };

  const handleStyleUpdate = (updates: any) => {
    if (clip.id) {
      const currentClip = projectStore.getState().clips[clip.id] as any;
      const currentStyle = currentClip?.style || {};
      handleUpdate({ style: { ...currentStyle, ...updates } });
    }
  };

  const handleFontChange = async (postScriptName: string) => {
    const font = getFontByPostScriptName(postScriptName);
    if (font) {
      await fontManager.addFont({ name: font.postScriptName, url: font.url });
      handleStyleUpdate({ fontFamily: font.postScriptName, fontUrl: font.url });
    }
  };

  const propertyKeys = getPropertiesForType(clip.type);

  const renderProperty = (key: PropertyKey) => {
    switch (key) {
      case "gradient": {
        const current = readGradient(coreClip);
        // Stops driven by a variable are shown as read-only chips: the value
        // is decided at render time, so a colour picker here would be a lie.
        const bindings = coreClip?.metadata?.pictify?.bindings || [];
        const boundStops: Record<number, string> = {};
        for (const binding of bindings) {
          const match = /^style\.colors\.(\d+)$/.exec(binding?.target || "");
          if (match) boundStops[Number(match[1])] = binding.variable;
        }
        return (
          <Properties.GradientProperty
            key={key}
            type={current.type}
            angle={current.angle}
            colors={current.colors}
            boundStops={boundStops}
            onChange={(next) => {
              handleUpdate({ style: { ...(coreClip?.style || {}), ...gradientStyle(next) } });
              // The Svelte side owns the variables panel and the dirty flag.
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );
      }

      case "transform":
        return (
          <Properties.TransformProperty
            key={key}
            x={getX()}
            y={getY()}
            width={getWidth()}
            height={getHeight()}
            rotation={getAngle()}
            onXChange={(val) => handleTransformUpdate({ x: val })}
            onYChange={(val) => handleTransformUpdate({ y: val })}
            onWidthChange={(val) => handleTransformUpdate({ width: val })}
            onHeightChange={(val) => handleTransformUpdate({ height: val })}
            onRotationChange={(val) => handleTransformUpdate({ angle: val })}
          />
        );

      case "opacity":
        return (
          <Properties.OpacityProperty
            key={key}
            value={getOpacity()}
            onChange={(val: number) => handleTransformUpdate({ opacity: val })}
          />
        );

      case "fill":
        return (
          <Properties.FillProperty
            key={key}
            color={style.fill || "#3b82f6"}
            onColorChange={(val: string) => handleStyleUpdate({ fill: val })}
          />
        );

      case "volume":
        return (
          <Properties.VolumeProperty
            key={key}
            value={getVolume()}
            onChange={(val: number) => handleUpdate({ volume: val })}
          />
        );

      case "textGroup": {
        const fontPostScriptName = style.fontFamily || "Inter-Regular";
        const font = getFontByPostScriptName(fontPostScriptName);
        const currentFamily = font?.family || fontPostScriptName;

        return (
          <Properties.TextGroupProperty
            key={key}
            text={coreClip.text || ""}
            onTextChange={(val) => handleUpdate({ text: val })}
            currentFamily={currentFamily}
            currentPostScriptName={fontPostScriptName}
            fontSize={style.fontSize || 40}
            onFontChange={handleFontChange}
            onFontStyleChange={handleFontChange}
            onFontSizeChange={(val) => handleStyleUpdate({ fontSize: val })}
            textAlign={(style.textAlign || style.align || "center") as "left" | "center" | "right"}
            onTextAlignChange={(val) => handleStyleUpdate({ textAlign: val, align: val })}
          />
        );
      }

      case "textColor":
        return (
          <Properties.TextColorProperty
            key={key}
            color={(style.color as string) || "#ffffff"}
            onColorChange={(val) => handleStyleUpdate({ color: val })}
          />
        );

      case "timing": {
        const timing = coreClip.timing || {};
        const display = timing.display || { from: 0, to: 5_000_000 };
        const applyDisplay = (from: number, to: number) => {
          handleUpdate({
            timing: {
              ...timing,
              display: { from, to },
            },
          });
        };
        return (
          <Properties.TimingProperty
            key={key}
            from={display.from}
            to={display.to}
            onFromChange={(fromUs) => {
              const length = display.to - display.from;
              applyDisplay(fromUs, fromUs + length);
            }}
            onDurationChange={(durationUs) => {
              applyDisplay(display.from, display.from + durationUs);
            }}
          />
        );
      }

      default:
        return null;
    }
  };

  return <div className="flex flex-col gap-1 py-2">{propertyKeys.map(renderProperty)}</div>;
}

export default function PropertiesPanel() {
  const selectedClips = useStudioStore((s) => s.selectedClips);

  if (selectedClips.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <span className="text-xs font-semibold text-muted-foreground">Nothing selected</span>
        <span className="text-[11px] leading-relaxed text-muted-foreground/70">
          Select a clip on the canvas or the timeline to edit its properties.
        </span>
      </div>
    );
  }

  if (selectedClips.length > 1) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <span className="text-sm font-medium text-foreground">
          {selectedClips.length} clips selected
        </span>
        <span className="text-[11px] text-muted-foreground/70">
          Select a single clip to edit its properties.
        </span>
      </div>
    );
  }

  const clip = selectedClips[0] as any;

  const handleDuplicate = () => {
    if (clip?.id) core.clip.duplicate([clip.id]);
  };

  const handleDelete = () => {
    if (clip?.id) core.clip.remove([clip.id]);
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Clip header with actions */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">{clip.name || clip.type}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{clip.type}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleDuplicate}
          title="Duplicate clip"
        >
          <RiFileCopyLine size={15} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          title="Delete clip"
        >
          <RiDeleteBinLine size={15} />
        </Button>
      </div>

      <ScrollArea className={cn("min-h-0 flex-1 px-3", clip.locked && "pointer-events-none opacity-50")}>
        <PropertiesPanelContent clip={clip} />
      </ScrollArea>
    </div>
  );
}
