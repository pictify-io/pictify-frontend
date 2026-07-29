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
  | "opacity"
  | "fill"
  | "textGroup"
  | "textColor"
  | "textStyle"
  | "volume"
  | "timing";

// Property configuration for each clip type
export const PROPERTY_REGISTRY: Record<string, PropertyKey[]> = {
  Image: ["transform", "opacity", "timing"],
  Video: ["transform", "opacity", "volume", "timing"],
  Text: ["textGroup", "textColor", "textStyle", "transform", "opacity", "timing"],
  Audio: ["volume", "timing"],
  Shape: ["transform", "fill", "opacity", "timing"],
  // Backdrop is the engine's only gradient-capable primitive. Without an entry
  // here getPropertiesForType falls through to the default set and the clip
  // gets no colour controls at all.
  Backdrop: ["gradient", "transform", "opacity", "timing"],
};

// Helper to get all properties for a clip type
export function getPropertiesForType(clipType: string): PropertyKey[] {
  return PROPERTY_REGISTRY[clipType] ?? ["transform", "opacity", "timing"];
}
