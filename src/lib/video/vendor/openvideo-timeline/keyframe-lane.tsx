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
import { timeUsToUnits, unitsToTimeUs, ITimelineScaleState } from "@openvideo/timeline";
import { core, projectStore } from "./runtime";
import { useTimelineOffsetX } from "./hooks";
import {
  readKeyframes,
  writeKeyframes,
  removeStop,
  moveStop,
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
  // Declared above the early returns: a conditional hook changes hook order
  // between renders and React tears the component down.
  const [dragging, setDragging] = React.useState<{ from: number; to: number } | null>(null);
  const selectedIds = useStore(projectStore, (s: any) => s.selectedIds);
  const clips = useStore(projectStore, (s: any) => s.clips);

  const clip = selectedIds?.length === 1 ? clips?.[selectedIds[0]] : null;
  const frames = React.useMemo(() => readKeyframes(clip), [clip]);

  const display = clip?.timing?.display || {};
  const from = Number(display.from) || 0;
  const to = Number(display.to) || 0;
  const span = to - from;
  // Computed unconditionally so the hooks below never sit behind a return.
  const active = Boolean(clip) && frames.length > 0 && span > 0;

  /** Absolute timeline position, matching the playhead exactly. */
  const xFor = (at: number) =>
    timelineOffsetX + 16 + timeUsToUnits(from + at * span, scale.zoom) - scrollLeft;

  /** A pointer x back to a fraction of the clip. The inverse of xFor. */
  const atFor = (clientX: number) => {
    const units = clientX - timelineOffsetX - 16 + scrollLeft;
    const timeUs = unitsToTimeUs(units, scale.zoom);
    return Math.min(1, Math.max(0, (timeUs - from) / span));
  };

  const commit = (next: any) => {
    if (!clip) return;
    core.clip.update(clip.id, { animations: writeKeyframes(next, span) ?? [] });
  };

  /*
   * Drag to retime.
   *
   * The marker follows the pointer through `dragging`; the document is written
   * ONCE on release. Committing on every pointermove would put fifty entries in
   * the undo history for one drag, so a single Cmd+Z would nudge the keyframe a
   * pixel rather than undoing the move.
   *
   * Listeners go on the WINDOW for the life of the gesture rather than using
   * setPointerCapture: the pointer leaves the 10px marker on the first move, so
   * the element's own handlers stop firing.
   *
   * This effect, and every other hook, runs BEFORE the "nothing to draw" return
   * below. Putting it after cost a render — React saw the hook count change
   * between renders and tore the component down, so the lane vanished entirely.
   */
  const dragRef = React.useRef<{ from: number; to: number } | null>(null);
  dragRef.current = dragging;

  React.useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event: PointerEvent) => {
      const current = dragRef.current;
      if (current) setDragging({ from: current.from, to: atFor(event.clientX) });
    };

    const onUp = () => {
      const current = dragRef.current;
      setDragging(null);
      if (!current) return;
      // A gesture that never moved a whole percent is a click: park the
      // playhead so the value sliders edit THIS keyframe.
      if (Math.round(current.from * 100) === Math.round(current.to * 100)) {
        core.playback?.seek?.(from + current.from * span);
        return;
      }
      commit(moveStop(frames, current.from, current.to));
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging !== null, frames, span, from, scale.zoom, scrollLeft, timelineOffsetX]);

  // Nothing selected, or a clip with no keyframes: the lane stays out of the
  // way rather than showing an empty row under every clip.
  if (!active) return null;

  const animated = KEYFRAME_PROPS.filter((spec) =>
    frames.some((frame: any) => frame.props[spec.name] !== undefined)
  );

  const isDragged = (at: number) =>
    dragging !== null && Math.round(dragging.from * 100) === Math.round(at * 100);
  /** Where a marker is drawn: the dragged one follows the pointer. */
  const shownAt = (at: number) => (isDragged(at) ? dragging!.to : at);

  const onPointerDown = (event: React.PointerEvent, at: number) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging({ from: at, to: at });
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
            The property name, in the timeline's label column.

            The column is the gutter every time-to-pixel calculation already
            offsets by (TIMELINE_OFFSET_X_LARGE), so a label sitting inside it
            can never collide with a marker: the earliest possible marker, at
            0%, starts where the column ends.
          */}
          <span
            className="pointer-events-none absolute truncate pr-2 text-right text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
            style={{ left: 0, top: 5, width: timelineOffsetX }}
          >
            {spec.label}
          </span>

          {frames
            .filter((frame: any) => frame.props[spec.name] !== undefined)
            .map((frame: any) => (
              <button
                key={frame.at}
                type="button"
                className={
                  "pointer-events-auto absolute z-10 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[1px] border border-black bg-brand-accent " +
                  (isDragged(frame.at)
                    ? "scale-125 cursor-grabbing"
                    : "cursor-grab transition-transform hover:scale-125")
                }
                // While dragging, the marker follows the pointer rather than
                // the document — the document is written once, on release.
                style={{ left: xFor(shownAt(frame.at)), top: 6 }}
                title={`${spec.label} keyframe at ${Math.round(shownAt(frame.at) * 100)}% — drag to retime, click to move the playhead here, double-click to remove`}
                aria-label={`${spec.label} keyframe at ${Math.round(frame.at * 100)} percent`}
                onPointerDown={(event) => onPointerDown(event, frame.at)}
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
