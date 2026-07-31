/*
 * The keyframe lane (written for Pictify).
 *
 * Keyframes started life in the properties panel with a miniature track per
 * property. That put the time axis in two places: a 160px strip in a side panel
 * and the real timeline underneath, at different scales and different scroll
 * positions. Retiming a keyframe meant eyeballing a proportion rather than
 * lining it up with the clip it belongs to.
 *
 * So the TIME half lives here, on the real axis, under the clip it animates.
 * The properties panel keeps the VALUE half, which has nothing to do with time
 * and is where the sliders belong.
 *
 * ── Why a DOM overlay and not canvas ──────────────────────────────────────
 *
 * The timeline is a fabric-derived canvas whose items are engine classes.
 * Drawing markers into it means subclassing those, and hit-testing, dragging
 * and hover states all have to be reimplemented against the canvas event model.
 * A positioned overlay gets real buttons, real focus, real titles, and the
 * position maths is four lines — the same four the playhead already uses:
 *
 *   left = timelineOffsetX + 16 + timeUsToUnits(timeUs, zoom) - scrollLeft
 *
 * Sharing that formula is what keeps the lane locked to the ruler through zoom
 * and scroll; computing it independently is how the two drift apart.
 */
import React from "react";
import { useStore } from "zustand";
import { timeUsToUnits, ITimelineScaleState } from "@openvideo/timeline";
import { core, projectStore } from "./runtime";
import { useTimelineOffsetX } from "./hooks";
import {
  readKeyframes,
  writeKeyframes,
  removeStop,
  KEYFRAME_PROPS,
} from "../../keyframes";

const LANE_HEIGHT = 22;

const KeyframeLane = ({
  scale,
  scrollLeft,
}: {
  scale: ITimelineScaleState;
  scrollLeft: number;
}) => {
  const timelineOffsetX = useTimelineOffsetX();
  const selectedIds = useStore(projectStore, (s: any) => s.selectedIds);
  const clips = useStore(projectStore, (s: any) => s.clips);

  const clip = selectedIds?.length === 1 ? clips?.[selectedIds[0]] : null;
  const frames = React.useMemo(() => readKeyframes(clip), [clip]);

  // Nothing selected, or a clip with no keyframes: the lane stays out of the
  // way rather than showing an empty row under every clip.
  if (!clip || !frames.length) return null;

  const display = clip.timing?.display || {};
  const from = Number(display.from) || 0;
  const to = Number(display.to) || 0;
  const span = to - from;
  if (span <= 0) return null;

  const animated = KEYFRAME_PROPS.filter((spec) =>
    frames.some((frame: any) => frame.props[spec.name] !== undefined)
  );

  /** Absolute timeline position, matching the playhead exactly. */
  const xFor = (at: number) =>
    timelineOffsetX + 16 + timeUsToUnits(from + at * span, scale.zoom) - scrollLeft;

  const commit = (next: any) => {
    core.clip.update(clip.id, { animations: writeKeyframes(next, span) ?? [] });
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: 0 }}>
      {animated.map((spec, row) => (
        <div
          key={spec.name}
          className="pointer-events-none absolute inset-x-0"
          style={{ top: row * LANE_HEIGHT, height: LANE_HEIGHT }}
        >
          {/*
            The property name.

            There is no left gutter to put this in — the timeline's offset is
            about ten pixels, not a label column — so the chip floats over the
            start of the lane with its own background. A keyframe at 0% sits
            under it, which is why the chip is behind the markers rather than
            over them: the marker stays clickable and the label stays readable.
          */}
          <span
            className="pointer-events-none absolute z-0 rounded-sm bg-background/85 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
            style={{ left: 2, top: 5 }}
          >
            {spec.label}
          </span>

          {frames
            .filter((frame: any) => frame.props[spec.name] !== undefined)
            .map((frame: any) => (
              <button
                key={frame.at}
                type="button"
                className="pointer-events-auto absolute z-10 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[1px] border border-black bg-brand-accent transition-transform hover:scale-125"
                style={{ left: xFor(frame.at), top: 6 }}
                title={`${spec.label} keyframe at ${Math.round(frame.at * 100)}% — click to move the playhead here, double-click to remove`}
                aria-label={`${spec.label} keyframe at ${Math.round(frame.at * 100)} percent`}
                // Click parks the playhead ON the keyframe, which is what makes
                // the value sliders in the properties panel edit THAT keyframe
                // rather than creating a new one next to it.
                onClick={() => core.playback?.seek?.(from + frame.at * span)}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  commit(removeStop(frames, frame.at));
                }}
              />
            ))}
        </div>
      ))}
    </div>
  );
};

export default KeyframeLane;
