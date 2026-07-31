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
import { alignPatch, distributePatches, orderPatches } from "../../../arrange";
import {
  previousClip,
  incomingTransition,
  createTransitionClip,
  DEFAULT_TRANSITION_US,
} from "../../../transitions";
import {
  buildAnimation,
  readAnimation,
  withAnimationMeta,
  DEFAULT_IN_FRACTION,
  DEFAULT_OUT_FRACTION,
} from "../../../animations";
import {
  effectParamSpecs,
  readEffectValues,
  effectValuePatch,
  resetEffectValues,
} from "../../../effects";
import ScenePanel from "./scene-panel";
import {
  readSpeed,
  speedPatch,
  SPEED_PRESETS,
  MIN_SPEED,
  MAX_SPEED,
} from "../../../clip-speed";
import {
  readStroke,
  strokePatch,
  readShadow,
  shadowPatch,
  readCornerRadius,
  cornerRadiusPatch,
  maxCornerRadius,
  readFlip,
  flipPatch,
  readSpacing,
  spacingPatch,
  readFade,
  fadePatch,
  fadeMaxMs,
} from "../../../clip-style";
import { getHostCallbacks } from "../runtime";
import { useEphemeralClip } from "./use-ephemeral-clip";
import { getFontByPostScriptName } from "../font-utils";
import * as Properties from "./options";

function PropertiesPanelContent({ clip }: { clip: any }) {
  const coreClipBase = useStore(projectStore, (s: any) => (clip?.id ? s.clips[clip.id] : null));
  // A transition is a SEPARATE clip, so subscribing only to the selected clip
  // leaves the control showing "None (cut)" after one is added. Subscribe to the
  // clip and track maps so the section reflects the document.
  const allClips = useStore(projectStore, (s: any) => s.clips);
  const allTracks = useStore(projectStore, (s: any) => s.tracks);
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

  // Arrange operates on a SET of clips, so it is defined once and used by both
  // the single-clip panel and the multi-select panel.
  const composition = (projectStore.getState() as any).settings || {};

  const applyAlign = (clips: any[], alignment: string) => {
    for (const c of clips) {
      const patch = alignPatch(c, alignment, composition);
      if (patch) core.clip.update(c.id, { transform: { ...c.transform, ...patch } });
    }
  };

  const applyDistribute = (clips: any[], axis: "x" | "y") => {
    for (const { id, patch } of distributePatches(clips, axis)) {
      const target = clips.find((c) => c.id === id);
      if (target) core.clip.update(id, { transform: { ...target.transform, ...patch } });
    }
  };

  const applyOrder = (clips: any[], op: string) => {
    const all = Object.values((projectStore.getState() as any).clips || {});
    for (const { id, zIndex } of orderPatches(clips, all as any[], op)) {
      const target = clips.find((c) => c.id === id);
      if (target) core.clip.update(id, { transform: { ...target.transform, zIndex } });
    }
  };

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

      case "arrange":
        return (
          <Properties.ArrangeProperty
            key={key}
            count={1}
            onAlign={(id) => applyAlign([coreClip], id)}
            onDistribute={(axis) => applyDistribute([coreClip], axis)}
            onOrder={(op) => applyOrder([coreClip], op)}
          />
        );

      case "transition": {
        const prev = previousClip(allClips, allTracks, coreClip);
        const existing = incomingTransition(allClips, coreClip);
        return (
          <Properties.TransitionProperty
            key={key}
            transitionKey={existing?.transitionKey || ""}
            durationUs={existing?.timing?.duration ?? DEFAULT_TRANSITION_US}
            hasPrevious={!!prev}
            onChange={({ transitionKey, durationUs }) => {
              // A transition is its own clip, so changing it means
              // remove-then-add rather than a property write.
              if (existing) core.clip.remove([existing.id]);
              if (transitionKey && prev) {
                core.clip.add(
                  createTransitionClip({
                    fromClip: prev,
                    toClip: coreClip,
                    key: transitionKey,
                    durationUs,
                  }) as any
                );
              }
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );
      }

      case "animation": {
        const stored = readAnimation(coreClip);
        const meta = coreClip?.metadata?.pictify?.animation || {};
        return (
          <Properties.AnimationProperty
            key={key}
            inPreset={stored.inPreset}
            outPreset={stored.outPreset}
            emphasisPreset={stored.emphasisPreset}
            inFraction={meta.inFraction ?? DEFAULT_IN_FRACTION}
            outFraction={meta.outFraction ?? DEFAULT_OUT_FRACTION}
            onChange={(next) => {
              const timing = coreClip?.timing?.display || {};
              const durationUs = Math.max(0, (timing.to ?? 0) - (timing.from ?? 0));
              const animations = buildAnimation(next, durationUs);
              // The engine stores only composed keyframes, so the preset choice
              // is mirrored into metadata (read-modify-write — variable
              // bindings live on the same object).
              handleUpdate({
                animations: animations ?? [],
                metadata: withAnimationMeta(coreClip, next),
              });
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );
      }

      case "textStyle":
        return (
          <Properties.TextStyleProperty
            key={key}
            style={style}
            onStyleChange={(patch) => {
              handleStyleUpdate(patch);
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "textColor":
        return (
          <Properties.TextColorProperty
            key={key}
            color={(style.color as string) || "#ffffff"}
            onColorChange={(val) => handleStyleUpdate({ color: val })}
          />
        );

      case "stroke":
        return (
          <Properties.StrokeProperty
            key={key}
            stroke={readStroke(coreClip)}
            onChange={(changes) => {
              handleStyleUpdate(strokePatch(readStroke(coreClip), changes));
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "shadow":
        return (
          <Properties.ShadowProperty
            key={key}
            shadow={readShadow(coreClip)}
            onChange={(changes) => {
              handleStyleUpdate(shadowPatch(readShadow(coreClip), changes));
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "cornerRadius":
        return (
          <Properties.CornerRadiusProperty
            key={key}
            value={readCornerRadius(coreClip)}
            max={maxCornerRadius(coreClip)}
            onChange={(val) => {
              handleStyleUpdate(cornerRadiusPatch(val, coreClip));
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "flip":
        return (
          <Properties.FlipProperty
            key={key}
            flip={readFlip(coreClip)}
            onToggle={(axis) => {
              // flip lives on the transform, not the style.
              handleTransformUpdate(flipPatch(coreClip, axis));
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "spacing": {
        const spacing = readSpacing(coreClip);
        return (
          <Properties.SpacingProperty
            key={key}
            lineHeight={spacing.lineHeight}
            letterSpacing={spacing.letterSpacing}
            onChange={(changes) => {
              handleStyleUpdate(spacingPatch(changes));
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );
      }

      case "effectConfig": {
        const specs = effectParamSpecs(coreClip.effectKey);
        return (
          <Properties.EffectConfigProperty
            key={key}
            specs={specs}
            values={readEffectValues(coreClip, specs)}
            onChange={(name, value) => {
              const patch = effectValuePatch(coreClip, specs, name, value);
              if (patch) handleUpdate(patch);
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
            onReset={() => {
              handleUpdate(resetEffectValues());
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );
      }

      case "captionColors":
        return (
          <Properties.CaptionColorsProperty
            key={key}
            colors={coreClip.caption?.colors || {}}
            onChange={(colors) => {
              // The caption bag is read-modify-write: `words` lives on the same
              // object and dropping it would erase the timings.
              handleUpdate({ caption: { ...(coreClip.caption || {}), colors } });
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "captionLayout":
        return (
          <Properties.CaptionLayoutProperty
            key={key}
            wordsPerLine={coreClip.wordsPerLine === "single" ? "single" : "multiple"}
            onChange={(wordsPerLine) => {
              handleUpdate({ wordsPerLine });
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "speed":
        return (
          <Properties.SpeedProperty
            key={key}
            speed={readSpeed(coreClip)}
            presets={SPEED_PRESETS}
            min={MIN_SPEED}
            max={MAX_SPEED}
            onChange={(value) => {
              // Retiming rewrites the whole timing object, so it goes through
              // handleUpdate rather than a style write.
              const patch = speedPatch(coreClip, value);
              if (patch) handleUpdate(patch);
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );

      case "fade": {
        const fade = readFade(coreClip);
        return (
          <Properties.FadeProperty
            key={key}
            inMs={fade.inMs}
            outMs={fade.outMs}
            maxMs={fadeMaxMs(coreClip)}
            onChange={(which, ms) => {
              // fadePatch returns a whole timing object, so it goes through
              // handleUpdate rather than handleStyleUpdate.
              handleUpdate(fadePatch(coreClip, which, ms));
              getHostCallbacks().onClipStyleChange?.(clip.id);
            }}
          />
        );
      }

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

/**
 * What you get with several clips selected.
 *
 * This used to say "select a single clip to edit its properties", which is
 * exactly backwards: aligning and stacking are the things you want when more
 * than one clip is selected. Per-clip properties still need a single selection,
 * so this offers what genuinely applies to a set.
 */
function MultiSelectPanel({ clips }: { clips: any[] }) {
  const storeClips = useStore(projectStore, (s: any) => s.clips);
  const composition = useStore(projectStore, (s: any) => s.settings);

  // Read through the store so positions are current after each operation —
  // the selection snapshot goes stale as soon as the first clip moves.
  const live = () => clips.map((c) => storeClips[c.id]).filter(Boolean);

  const applyAlign = (alignment: string) => {
    for (const c of live()) {
      const patch = alignPatch(c, alignment, composition);
      if (patch) core.clip.update(c.id, { transform: { ...c.transform, ...patch } });
    }
  };
  const applyDistribute = (axis: "x" | "y") => {
    const current = live();
    for (const { id, patch } of distributePatches(current, axis)) {
      const target = current.find((c: any) => c.id === id);
      if (target) core.clip.update(id, { transform: { ...target.transform, ...patch } });
    }
  };
  const applyOrder = (op: string) => {
    const current = live();
    const all = Object.values(storeClips || {});
    for (const { id, zIndex } of orderPatches(current, all as any[], op)) {
      const target = current.find((c: any) => c.id === id);
      if (target) core.clip.update(id, { transform: { ...target.transform, zIndex } });
    }
  };

  const setOpacityAll = (value: number) => {
    for (const c of live()) {
      core.clip.update(c.id, { transform: { ...c.transform, opacity: value } });
    }
  };

  const ids = clips.map((c) => c.id);
  const first = live()[0];

  return (
    <ScrollArea className="h-full bg-background">
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">{clips.length} clips selected</span>
          <span className="text-[10px] text-muted-foreground/70">
            Align, order and opacity apply to all of them
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            title="Duplicate"
            onClick={() => core.clip.duplicate(ids)}
          >
            <RiFileCopyLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            title="Delete"
            onClick={() => core.clip.remove(ids)}
          >
            <RiDeleteBinLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 py-2">
        <Properties.ArrangeProperty
          count={clips.length}
          onAlign={applyAlign}
          onDistribute={applyDistribute}
          onOrder={applyOrder}
        />
        <Properties.OpacityProperty
          value={first?.transform?.opacity ?? 1}
          onChange={setOpacityAll}
        />
      </div>
    </ScrollArea>
  );
}

export default function PropertiesPanel() {
  const selectedClips = useStudioStore((s) => s.selectedClips);

  // No selection is not an empty state: it is when the composition's OWN
  // settings — canvas size, frame rate, export quality — are the only thing
  // there is to edit. Showing "nothing selected" here wasted the one moment
  // those controls have somewhere obvious to live.
  if (selectedClips.length === 0) {
    return <ScenePanel />;
  }

  if (selectedClips.length > 1) {
    return <MultiSelectPanel clips={selectedClips as any[]} />;
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
