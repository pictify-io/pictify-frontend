/*
 * Composition settings (written for Pictify; upstream splits these across
 * options/{canvas-group,export-group,project-group}.tsx).
 *
 * These appear when NOTHING is selected, because that is the one moment the
 * properties panel has nothing else to say and the one place people reliably
 * look. Upstream reaches them through a "Scene" pseudo-selection; the effect is
 * the same and this needs no fake clip.
 *
 * Every control here changes the rendered output — canvas size and frame rate
 * are read by the engine and the renderer, and `settings.bitrate` is read by
 * service/openvideo-renderer.js. Container format is deliberately absent: the
 * renderer hardcodes mp4, so a format selector would do nothing.
 */
import React from "react";
import { useStore } from "zustand";
import { core, projectStore } from "../runtime";
import { ColorField, NumberInput, Select, cn } from "../ui";
import {
  ASPECT_PRESETS,
  QUALITY_PRESETS,
  FPS_OPTIONS,
  matchAspectPreset,
  matchQualityPreset,
  aspectPatch,
  rotatePatch,
  settingsPatch,
  readSettings,
  estimatedSizeMb,
} from "../../../scene-settings";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-semibold text-foreground">{title}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex w-[160px] items-center gap-1.5">{children}</div>
    </div>
  );
}

export default function ScenePanel({
  templateName,
  onTemplateNameChange,
}: {
  templateName?: string;
  onTemplateNameChange?: (name: string) => void;
}) {
  const rawSettings = useStore(projectStore, (state: any) => state.settings);
  const settings = readSettings(rawSettings || {});
  const activePreset = matchAspectPreset(settings.width, settings.height);
  const activeQuality = matchQualityPreset(settings.bitrate);

  const apply = (changes: any) => {
    const patch = settingsPatch(settings, changes);
    // On the STORE STATE, not core.project: ProjectStore merges state and
    // actions, while core.project carries only new/export/import — calling
    // updateSettings there throws.
    if (Object.keys(patch).length) (projectStore.getState() as any).updateSettings(patch);
  };

  const durationUs = Number(rawSettings?.duration) || 0;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-bold text-foreground">Composition</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Nothing selected
        </p>
      </div>

      <div className="ov-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {onTemplateNameChange && (
          <div className="flex flex-col border-b border-border/50 pb-3">
            <SectionTitle title="Project" />
            <input
              value={templateName || ""}
              onChange={(event) => onTemplateNameChange(event.target.value)}
              placeholder="Untitled template"
              aria-label="Template name"
              className="h-7 w-full rounded border border-border bg-muted px-2 text-xs text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        )}

        <div className="flex flex-col border-b border-border/50 pb-3">
          <SectionTitle title="Canvas" />

          {/* Named by destination, not by ratio — "9:16" is not the decision
              anyone is actually making. */}
          <div className="flex flex-col gap-1 py-1">
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => apply(aspectPatch(preset.id))}
                className={cn(
                  "flex items-center justify-between rounded border px-2 py-1.5 text-left transition-colors",
                  activePreset?.id === preset.id
                    ? "border-primary/60 bg-primary/15"
                    : "border-border bg-muted/60 hover:border-primary/50 hover:bg-accent"
                )}
              >
                <span className="text-[11px] font-semibold text-foreground">{preset.label}</span>
                <span className="text-[10px] text-muted-foreground">{preset.ratio}</span>
              </button>
            ))}
          </div>

          <Row label="Size">
            <NumberInput
              value={settings.width}
              onChange={(val) => apply({ width: val })}
              aria-label="Canvas width"
            />
            <NumberInput
              value={settings.height}
              onChange={(val) => apply({ height: val })}
              aria-label="Canvas height"
            />
          </Row>

          <div className="py-1">
            <button
              type="button"
              onClick={() => apply(rotatePatch(settings))}
              className="h-7 w-full rounded border border-border bg-muted/60 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground"
            >
              Swap width and height
            </button>
          </div>

          <Row label="Background">
            <ColorField
              color={settings.backgroundColor}
              onChange={(val) => apply({ backgroundColor: val })}
              className="w-full"
            />
          </Row>

          <Row label="Frame rate">
            <Select
              value={String(settings.fps)}
              onValueChange={(val) => apply({ fps: Number(val) })}
              options={FPS_OPTIONS.map((fps) => ({ value: String(fps), label: `${fps} fps` }))}
              aria-label="Frame rate"
            />
          </Row>
        </div>

        <div className="flex flex-col pb-3">
          <SectionTitle title="Export" />

          <div className="flex gap-1 py-1">
            {QUALITY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.hint}
                onClick={() => apply({ bitrate: preset.bitrate })}
                className={cn(
                  "flex-1 rounded border px-2 py-1.5 text-[11px] font-semibold transition-colors",
                  activeQuality?.id === preset.id
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-border bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/*
            A bitrate with no consequence attached is a number nobody can reason
            about, so the trade-off is spelled out. Only shown once the
            composition has a length, since the estimate needs one.
          */}
          {durationUs > 0 && (
            <p className="pt-1 text-[10px] leading-snug text-muted-foreground">
              About {estimatedSizeMb(settings.bitrate, durationUs)} MB for this{" "}
              {Math.round(durationUs / 1_000_000)}s video. Format is MP4.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
