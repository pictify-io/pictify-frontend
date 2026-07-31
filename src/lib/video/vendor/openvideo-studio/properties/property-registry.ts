/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/right-panel/properties/property-registry.tsx
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: trimmed to the property set the
 * Pictify studio panels implement (transform, textGroup, textColor, fill,
 * opacity, volume, timing); caption/effect/transition/scene entries dropped;
 * a Pictify-written "gradient" property added for Backdrop clips.
 */

export type PropertyKey =
  | "gradient"
  | "transform"
  | "flip"
  | "opacity"
  | "fill"
  | "stroke"
  | "shadow"
  | "cornerRadius"
  | "textGroup"
  | "textColor"
  | "textStyle"
  | "spacing"
  | "animation"
  | "transition"
  | "arrange"
  | "volume"
  | "fade"
  | "effectConfig"
  | "captionColors"
  | "captionLayout"
  | "speed"
  | "textFit"
  | "timing";

/*
 * Which controls each clip type gets.
 *
 * The rule is that a control only appears where the ENGINE renders it. The type
 * definitions are not sufficient evidence: `IBaseClipStyle` declares `shadow`
 * for every clip, but engine-pixi 1.3.2 reads it as
 *
 *   type !== "Text" && type !== "Caption" && type !== "Shape"
 *     ? applyShadow(...)
 *     : (shadowContainer.visible = false, shadowContainer.filters = [])
 *
 * so a Shape shadow is silently discarded. Verified on canvas: a cyan shadow at
 * blur 60 / offsetY 50 / alpha 1 on a Shape changes nothing. Hence:
 *
 *   shadow        Image and Video only. Text gets its own shadow through
 *                 TextStyleProperty, which drives applyShadowFilter on the text
 *                 container — a different code path that does work.
 *   stroke        Image, Video and Shape (verified: a red 40px stroke draws on a
 *                 Shape). Text already has one in TextStyleProperty, so adding it
 *                 here would render the section twice.
 *   cornerRadius  IBaseClipStyle.borderRadius. Verified on canvas. Skipped for
 *                 Text: rounding a glyph box with no background is invisible.
 *   flip          IClipTransform.flip. Image and Video only — mirrored text is a
 *                 typo, not a style.
 *   spacing       ITextStyle.lineHeight / letterSpacing.
 *   fade          IClipTiming.fadeIn / fadeOut, so anything with audio.
 */
export const PROPERTY_REGISTRY: Record<string, PropertyKey[]> = {
  /*
   * `speed` is Video and Audio only — the two clip types with a source that
   * actually plays. A Shape has no timebase to run faster.
   *
   * There is deliberately no colour grading or chroma key entry. Both fields
   * exist in the engine's serialization types and neither is applied by
   * engine-pixi 1.3.2; see src/lib/video/clip-speed.js for the measurement.
   */
  Image: ["transform", "flip", "arrange", "animation", "transition", "opacity", "cornerRadius", "stroke", "shadow", "timing"],
  Video: ["transform", "flip", "arrange", "animation", "transition", "opacity", "cornerRadius", "stroke", "shadow", "volume", "fade", "speed", "timing"],
  Text: ["textGroup", "textColor", "textStyle", "spacing", "textFit", "transform", "arrange", "animation", "transition", "opacity", "timing"],
  Audio: ["volume", "fade", "speed", "timing"],
  Shape: ["transform", "fill", "arrange", "animation", "transition", "opacity", "cornerRadius", "stroke", "timing"],
  /*
   * An Effect clip has no transform: it is a shader applied to everything
   * beneath it, so it has no position or size of its own. Its whole
   * configuration is the shader's uniforms plus how long it runs.
   */
  Effect: ["effectConfig", "timing"],
  /*
   * A Caption carries the same text styling as any Text clip, plus the two
   * things that are specific to it: which colours mark spoken versus upcoming
   * words, and whether the whole phrase or one word is on screen. No `stroke`
   * or `shadow` entry — the engine skips both for Caption exactly as it does
   * for Text, and TextStyleProperty already provides them.
   */
  Caption: ["captionColors", "captionLayout", "textColor", "textStyle", "spacing", "textFit", "transform", "arrange", "animation", "opacity", "timing"],
  // Backdrop is the engine's only gradient-capable primitive. Without an entry
  // here getPropertiesForType falls through to the default set and the clip
  // gets no colour controls at all.
  Backdrop: ["gradient", "transform", "arrange", "animation", "opacity", "timing"],
};

// Helper to get all properties for a clip type
export function getPropertiesForType(clipType: string): PropertyKey[] {
  return PROPERTY_REGISTRY[clipType] ?? ["transform", "opacity", "timing"];
}
