/*
 * Pictify addition — NOT vendored from openvideodev/react-video-editor.
 *
 * Clip colour, in one place.
 *
 * The upstream timeline gives each clip type a saturated mid-tone chosen to sit
 * on a near-black track (#0081ae text, #00849a audio, #6d70b8 shape…). On the
 * Repro Shop's light track those read as a bag of unrelated brights, and they
 * carry no meaning beyond "different from the last one".
 *
 * These are the riso inks at light coverage instead. The point of the family is
 * that a glance at the track tells you what KIND of thing each clip is before
 * you read a single label — text is always rose, video always sky — and that
 * the whole row still reads as one printed object rather than a chart legend.
 *
 * Every fill is light enough to take ink-black label text, except `effect`,
 * which is deliberately the one dark block: an effect is not footage, and the
 * inversion says so faster than an icon.
 */

/** Ink on light fills. */
export const CLIP_LABEL = "rgba(0,0,0,0.72)";
/** Paper on the one dark fill. */
export const CLIP_LABEL_ON_DARK = "rgba(255,255,255,0.82)";

export const CLIP_FILL = {
  text: "#FFD3E8", // rose
  caption: "#FFD3E8", // rose — a caption is text with a schedule
  video: "#A9D7F2", // sky
  image: "#D3E7F6", // powder
  audio: "#D8F34A", // field
  effect: "#242628", // press — the one dark block
  // Not named by the board. Kept in the family and deliberately quiet: a shape
  // or a backdrop is scenery, and should not outrank the content on the track.
  shape: "#E2E4DD", // canvas
  backdrop: "#E2E4DD" // canvas
} as const;

export type ClipKind = keyof typeof CLIP_FILL;
