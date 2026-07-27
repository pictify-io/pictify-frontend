/*
 * Vendored from openvideodev/react-video-editor — src/components/editor/timeline/types.ts (+ IClip/IDisplay from src/types/timeline.ts)
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased onto this
 * vendor directory.
 */
export interface Filmstrip {
  segmentIndex?: number;
  offset: number;
  thumbnailsCount: number;
  startTime: number;
  widthOnScreen: number;
}

export interface FilmstripBacklogOptions {
  thumbnailsPerSegment: number; // Number of thumbnails preloaded for smooth scrolling
  segmentSize: number; // Total width required to display thumbnails side by side
}

export const calculateThumbnailSegmentLayout = (
  thumbnailHeight: number,
): FilmstripBacklogOptions => {
  // Calculate the maximum number of thumbnails based on the thumbnail width
  let maxThumbnails = Math.floor(1200 / thumbnailHeight);

  // Calculate the total width required for the thumbnails
  let segmentSize = maxThumbnails * thumbnailHeight;

  return {
    thumbnailsPerSegment: maxThumbnails,
    segmentSize,
  };
};

//  it calculates the number of segments that are offscreen
export const calculateOffscreenSegments = (
  offscreenHeight: number,
  trimFromSize: number,
  segmentSize: number,
) => {
  const offscreenSegments = Math.floor((offscreenHeight + trimFromSize) / segmentSize);
  return offscreenSegments;
};

interface Thumbnail {
  ts: number;
  url: string;
}

interface Result {
  ts: number;
  url: string;
}

export function matchTimestampsToNearestThumbnails(
  timestamps: number[],
  thumbnailsList: Thumbnail[],
): Result[] {
  const results: Result[] = [];

  timestamps.forEach((ts) => {
    // Find the closest thumbnail
    const closestThumbnail = thumbnailsList.reduce((prev, curr) => {
      return Math.abs(curr.ts - ts) < Math.abs(prev.ts - ts) ? curr : prev;
    });

    // Push the result into the results array
    results.push({
      ts,
      url: closestThumbnail.url,
    });
  });

  return results;
}

// ── Studio schema types (from upstream src/types/timeline.ts) ────────────

export type TrackType =
  | "Video"
  | "Audio"
  | "Image"
  | "Text"
  | "Caption"
  | "Effect"
  | "Transition"
  | "Placeholder";

// Display interface from Studio schema
export interface IDisplay {
  from: number; // Microseconds
  to: number; // Microseconds
}

// Clip interface from Studio schema
export interface IClip {
  id: string;
  type: string; // 'Caption', 'Text', 'Video', etc.
  name?: string;
  text?: string;
  src?: string;
  display: IDisplay;
  trim?: { from: number; to: number };
  duration: number; // Microseconds
  sourceDuration?: number; // Total duration of the media in microseconds
  playbackRate?: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  angle?: number;
  zIndex?: number;
  opacity?: number;
  flip?: { horizontal: boolean; vertical: boolean } | string | null;
  style?: any;
  caption?: any;
  effects?: any[];
  locked?: boolean;
  // ... any other props
}

// Track interface from Studio schema (Normalized)
export interface ITimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  clipIds: string[];
  muted?: boolean;
}
