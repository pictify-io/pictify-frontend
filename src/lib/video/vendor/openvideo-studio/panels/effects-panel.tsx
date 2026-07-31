/*
 * Effects tab (written for Pictify; upstream's equivalent is
 * src/components/editor/media-panel/panel/effects.tsx).
 *
 * An effect is a clip that runs a shader over everything below it for as long
 * as it is on screen. The catalogue comes from the engine's own registry rather
 * than a list in this file — see ../../../effects.js.
 *
 * ── The thumbnails are somebody else's server ─────────────────────────────
 *
 * The engine builds preview URLs on a third-party CDN. They are worth showing
 * (an effect list without previews is 150 words nobody can choose between) but
 * they are not allowed to be load-bearing: a tile whose image fails still shows
 * its name and still adds the effect. That is what the `failed` set is for.
 */
import React from "react";
import { generateId } from "@openvideo/core";
import { core } from "../runtime";
import { ScrollArea, Input, cn } from "../ui";
import { EFFECT_OPTIONS, createEffectClip } from "../../../effects";
import { effectPreviewSpec } from "../../../effect-preview";
import "./effects-preview.css";

export default function EffectsPanel() {
  const [query, setQuery] = React.useState("");
  const [failed, setFailed] = React.useState<Record<string, boolean>>({});
  // Only ONE tile animates at a time. Fifty-one looping animations in a
  // scrolling grid is a space heater and makes the panel impossible to read.
  const [active, setActive] = React.useState<string | null>(null);

  // The registry is static for the life of the page; reading it on every
  // keystroke would rebuild 150 objects per character typed.
  const options = React.useMemo(() => EFFECT_OPTIONS(), []);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  const addEffect = (option: { value: string; label: string }) => {
    core.clip.add({
      id: generateId(),
      ...createEffectClip({ key: option.value, label: option.label }),
    } as any);
  };

  if (!options.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold text-foreground">Effects are unavailable</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          The rendering engine did not report any effects. Reloading the editor usually fixes it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-3 pt-3">
        <p className="pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Effects
        </p>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search effects"
          aria-label="Search effects"
          className="h-7 text-xs"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-4 pt-3">
        {!visible.length ? (
          <p className="pt-4 text-center text-[11px] text-muted-foreground">
            No effect matches “{query}”.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {visible.map((option) => {
              const preview = effectPreviewSpec(option.value);
              const playing = active === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => addEffect(option)}
                  title={`Add ${option.label}`}
                  // Pointer AND focus, so the preview is reachable by keyboard.
                  onMouseEnter={() => setActive(option.value)}
                  onMouseLeave={() => setActive((current) => (current === option.value ? null : current))}
                  onFocus={() => setActive(option.value)}
                  onBlur={() => setActive((current) => (current === option.value ? null : current))}
                  className="group flex flex-col overflow-hidden rounded border border-border bg-muted/60 text-left transition-colors hover:border-primary/60 hover:bg-accent focus:border-primary/60 focus:outline-none"
                >
                  <span className="relative block aspect-video w-full overflow-hidden bg-black/40">
                    {option.previewStatic && !failed[option.value] ? (
                      <img
                        src={option.previewStatic}
                        alt=""
                        loading="lazy"
                        onError={() => setFailed((prev) => ({ ...prev, [option.value]: true }))}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      /*
                       * The engine's thumbnails are on a CDN that answers 403,
                       * so this is what almost every tile actually shows: an
                       * animated approximation of the effect's character,
                       * running only while the tile is hovered or focused.
                       */
                      <span
                        aria-hidden="true"
                        className={cn(preview.className, playing && "ovfx-playing")}
                      />
                    )}
                  </span>
                  <span className="truncate px-2 py-1.5 text-[11px] text-foreground">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
