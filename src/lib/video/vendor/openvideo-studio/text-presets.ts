/*
 * Vendored from openvideodev/react-video-editor — src/constants/text-presets.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: trimmed to a subset of the
 * upstream styled presets, and three structural presets (Heading / Subtitle /
 * Body, written for Pictify) prepended so the Text panel always offers the
 * basics. Positions target the default 1080x1920 composition.
 */

const BASE_TIMING = {
  display: { from: 0, to: 5000000 },
  trim: { from: 0, to: 5000000 },
  duration: 5000000,
  playbackRate: 1,
};

export const TEXT_PRESETS = [
  // ── Structural presets (written for Pictify) ───────────────────────────
  {
    type: "Text",
    name: "Heading",
    text: "Heading",
    style: {
      fontSize: 120,
      fontFamily: "Inter-Bold",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 900,
      fontUrl:
        "https://fonts.gstatic.com/s/inter/v7/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf",
      color: "#ffffff",
    },
    timing: BASE_TIMING,
    transform: { x: 90, y: 640, width: 900, height: 160, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {},
  },
  {
    type: "Text",
    name: "Subtitle",
    text: "Subtitle",
    style: {
      fontSize: 64,
      fontFamily: "Inter-Medium",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 900,
      fontUrl:
        "https://fonts.gstatic.com/s/inter/v7/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf",
      color: "#e5e7eb",
    },
    timing: BASE_TIMING,
    transform: { x: 90, y: 860, width: 900, height: 100, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {},
  },
  {
    type: "Text",
    name: "Body",
    text: "Body text goes here",
    style: {
      fontSize: 44,
      fontFamily: "Inter-Regular",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "left",
      wordWrap: true,
      wordWrapWidth: 900,
      fontUrl:
        "https://fonts.gstatic.com/s/inter/v7/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf",
      color: "#d1d5db",
    },
    timing: BASE_TIMING,
    transform: { x: 90, y: 1020, width: 900, height: 220, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {},
  },

  // ── Upstream styled presets ────────────────────────────────────────────
  {
    type: "Text",
    name: "Classic Bold",
    text: "Title",
    style: {
      fontSize: 96,
      fontFamily: "Roboto-Bold",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 600,
      fontUrl: "https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf",
      color: "#ffffff",
    },
    timing: BASE_TIMING,
    transform: { x: 240, y: 898, width: 590, height: 109, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {
      previewUrl: "https://cdn.scenify.io/text-preset-preview/preset-text-5.png",
    },
  },
  {
    type: "Text",
    name: "Simple Badge",
    text: "Simple",
    style: {
      fontSize: 48,
      fontFamily: "Montserrat-Bold",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 600,
      fontUrl: "https://fonts.gstatic.com/s/montserrat/v18/JTURjIg1_i6t8kCHKm45_dJE7g7J_950vCo.ttf",
      color: "#080808",
      background: {
        color: "#FFFFFF",
        paddingY: 12,
        paddingX: 24,
      },
    },
    timing: BASE_TIMING,
    transform: { x: 240, y: 898, width: 590, height: 109, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {
      previewUrl: "https://cdn.scenify.io/text-preset-preview/preset-text-1.png",
    },
  },
  {
    type: "Text",
    name: "Elegant Serif",
    text: "Serif",
    style: {
      fontSize: 48,
      fontFamily: "PTSerif-Bold",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 600,
      fontUrl: "https://fonts.gstatic.com/s/ptserif/v12/EJRSQgYoZZY2vCFuvAnt65qVXSr3pNNB.ttf",
      color: "#ffffff",
    },
    timing: BASE_TIMING,
    transform: { x: 248, y: 895, width: 582, height: 192, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {
      previewUrl: "https://cdn.scenify.io/text-preset-preview/preset-text-4.png",
    },
  },
  {
    type: "Text",
    name: "Poppins Bold",
    text: "Bold",
    style: {
      fontSize: 96,
      fontFamily: "Poppins-Bold",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 600,
      fontUrl: "https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLCz7V1tvFP-KUEg.ttf",
      color: "#ffffff",
    },
    timing: BASE_TIMING,
    transform: { x: 245, y: 864, width: 582, height: 192, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {
      previewUrl: "https://cdn.scenify.io/text-preset-preview/preset-text-2.png",
    },
  },
  {
    type: "Text",
    name: "Abril Elegant",
    text: "Elegant",
    style: {
      fontSize: 96,
      fontFamily: "AbrilFatface-Regular",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 600,
      fontUrl:
        "https://fonts.gstatic.com/s/abrilfatface/v12/zOL64pLDlL1D99S8g8PtiKchm-BsjOLhZBY.ttf",
      color: "#ffffff",
    },
    timing: BASE_TIMING,
    transform: { x: 240, y: 898, width: 590, height: 192, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {
      previewUrl: "https://cdn.scenify.io/text-preset-preview/preset-text-9.png",
    },
  },
  {
    type: "Text",
    name: "Industrial Display",
    text: "INDUSTRIAL",
    style: {
      fontSize: 96,
      fontFamily: "BigShouldersDisplay-Bold",
      fontWeight: "normal",
      fontStyle: "normal",
      align: "center",
      wordWrap: true,
      wordWrapWidth: 600,
      fontUrl:
        "https://fonts.gstatic.com/s/bigshouldersdisplay/v6/fC1MPZJEZG-e9gHhdI4-NBbfd2ys3SjJCx12wPgf9g-_3F0YdWg8JF46SRP4yZQ.ttf",
      color: "#ffffff",
    },
    timing: BASE_TIMING,
    transform: { x: 240, y: 898, width: 590, height: 192, angle: 0, opacity: 1, zIndex: 10 },
    metadata: {
      previewUrl: "https://cdn.scenify.io/text-preset-preview/preset-text-8.png",
    },
  },
];
