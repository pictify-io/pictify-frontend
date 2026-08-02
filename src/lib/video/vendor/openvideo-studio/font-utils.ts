/*
 * Vendored from openvideodev/react-video-editor — src/utils/font-utils.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import path rebased onto the
 * vendored fonts subset (./fonts instead of @/constants/fonts).
 */
import { fonts } from "./fonts";

export interface FontStyle {
  id: string;
  family: string;
  fullName: string;
  postScriptName: string;
  url: string;
  preview: string;
  style: string;
}

export interface FontFamily {
  family: string;
  mainFont: FontStyle;
  styles: FontStyle[];
}

export const getGroupedFonts = (): FontFamily[] => {
  const groups: { [key: string]: FontStyle[] } = {};

  fonts.forEach((font) => {
    if (!groups[font.family]) {
      groups[font.family] = [];
    }
    groups[font.family].push(font);
  });

  return Object.keys(groups).map((family) => {
    const styles = groups[family];
    // Find Regular font or use the first one available
    const mainFont =
      styles.find(
        (s) =>
          s.postScriptName.toLowerCase().endsWith("-regular") ||
          s.fullName.toLowerCase().endsWith(" regular") ||
          s.style.toLowerCase() === "regular",
      ) || styles[0];

    return {
      family,
      mainFont,
      styles,
    };
  });
};

export const getFontByPostScriptName = (postScriptName: string) => {
  return fonts.find((f) => f.postScriptName === postScriptName);
};
