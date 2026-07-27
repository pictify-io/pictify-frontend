/*
 * Vendored from openvideodev/react-video-editor —
 * src/components/editor/right-panel/properties/property-registry.tsx
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: trimmed to the property set the
 * Pictify studio panels implement (transform, textGroup, textColor, fill,
 * opacity, volume, timing); caption/effect/transition/scene entries dropped.
 */

export type PropertyKey =
  | "transform"
  | "opacity"
  | "fill"
  | "textGroup"
  | "textColor"
  | "volume"
  | "timing";

// Property configuration for each clip type
export const PROPERTY_REGISTRY: Record<string, PropertyKey[]> = {
  Image: ["transform", "opacity", "timing"],
  Video: ["transform", "opacity", "volume", "timing"],
  Text: ["textGroup", "textColor", "transform", "opacity", "timing"],
  Audio: ["volume", "timing"],
  Shape: ["transform", "fill", "opacity", "timing"],
};

// Helper to get all properties for a clip type
export function getPropertiesForType(clipType: string): PropertyKey[] {
  return PROPERTY_REGISTRY[clipType] ?? ["transform", "opacity", "timing"];
}
