/*
 * Vendored from openvideodev/react-video-editor — merged from
 * src/components/editor/constants/constants.ts, constants/scale.ts and
 * src/components/editor/constants.ts (editorFont).
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: files merged into one module;
 * everything else verbatim.
 */
import { ITimelineScaleState } from "@openvideo/timeline";

export const PREVIEW_FRAME_WIDTH = 188;
export const DEFAULT_FRAMERATE = 60;
export const FRAME_INTERVAL = 1000 / DEFAULT_FRAMERATE;
export const TIMELINE_OFFSET_X = 8; // Static fallback value
export const TIMELINE_OFFSET_CANVAS_LEFT = 16;
export const TIMELINE_OFFSET_CANVAS_RIGHT = 80;
export const DEFAULT_FONT = "Roboto";
export const DEFAULT_WEIGHT = "Regular";
export const SECONDARY_FONT_URL = "https://cdn.designcombo.dev/fonts/Geist-SemiBold.ttf";
export const SECONDARY_FONT = "geist-regular";

export const editorFont = {
  fontFamily: SECONDARY_FONT,
  fontUrl: SECONDARY_FONT_URL,
};

export const LARGER_FONT_SIZE = 30;
export const LARGE_FONT_SIZE = 24;
export const NORMAL_FONT_SIZE = 16;
export const SMALL_FONT_SIZE = 12;

// Dynamic timeline offset values
/*
 * The left gutter, and therefore the width of the label column.
 *
 * Everything that maps time to pixels derives from this — the ruler, the
 * playhead, the spacer before the tracks canvas, the keyframe lane and
 * getFitZoomLevel — so widening it moves the whole timeline right together and
 * nothing has to be adjusted to match.
 *
 * It was 16px, which is a margin rather than a column: keyframe property names
 * had nowhere to go and collided with a marker at 0%.
 */
export const TIMELINE_OFFSET_X_SMALL = 64;
export const TIMELINE_OFFSET_X_LARGE = 96;

// Timeline item selection styling
export const TIMELINE_SELECTED_BORDER_COLOR = "rgba(24, 163, 222, 0.5)";
export const TIMELINE_UNSELECTED_BORDER_COLOR = "rgba(255, 255, 255, 0.05)";
export const TIMELINE_BORDER_WIDTH = 2;
export const TIMELINE_ITEM_BORDER_RADIUS = 4;

export const TIMELINE_ZOOM_LEVELS: ITimelineScaleState[] = [
  { index: 0, unit: 1, zoom: 0.25, segments: 5 },
  { index: 1, unit: 1, zoom: 0.5, segments: 5 },
  { index: 2, unit: 1, zoom: 1, segments: 5 },
  { index: 3, unit: 1, zoom: 1.5, segments: 5 },
  { index: 4, unit: 1, zoom: 2, segments: 5 },
  { index: 5, unit: 1, zoom: 3, segments: 5 },
  { index: 6, unit: 1, zoom: 4, segments: 5 },
];
