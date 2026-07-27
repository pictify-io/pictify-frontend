/*
 * Vendored from openvideodev/react-video-editor — src/components/editor/utils/mediabunny.ts
 * License: OpenVideo License (free tier, accepted 2026-07-27) — see LICENSE at
 * the root of this directory. Local changes: import paths rebased onto this
 * vendor directory.
 */
import { ALL_FORMATS, Input, UrlSource, VideoSample, VideoSampleSink } from "mediabunny";

type Options = {
  track: { width: number; height: number };
  container: string;
  durationInSeconds: number | null;
};

export type ExtractFramesTimestampsInSecondsFn = (options: Options) => Promise<number[]> | number[];

export type ExtractFramesProps = {
  src: string;
  timestampsInSeconds: number[] | ExtractFramesTimestampsInSecondsFn;
  onVideoSample: (sample: VideoSample) => void;
  signal?: AbortSignal;
};

// Local change: upstream used explicit-resource-management `using`
// declarations, which Rollup cannot parse yet — replaced with try/finally
// dispose calls. Behaviour is identical.
const disposeResource = (resource: any) => {
  try {
    resource?.[Symbol.dispose]?.();
  } catch {
    // best-effort cleanup
  }
};

export async function extractFrames({
  src,
  timestampsInSeconds,
  onVideoSample,
  signal,
}: ExtractFramesProps): Promise<void> {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src),
  });
  try {

  const [durationInSeconds, format, videoTrack] = await Promise.all([
    input.computeDuration(),
    input.getFormat(),
    input.getPrimaryVideoTrack(),
  ]);

  if (!videoTrack) {
    throw new Error("No video track found in the input");
  }

  if (signal?.aborted) {
    throw new Error("Aborted");
  }

  const timestamps =
    typeof timestampsInSeconds === "function"
      ? await timestampsInSeconds({
          track: {
            width: videoTrack.displayWidth,
            height: videoTrack.displayHeight,
          },
          container: format.name,
          durationInSeconds,
        })
      : timestampsInSeconds;

  if (timestamps.length === 0) {
    return;
  }

  if (signal?.aborted) {
    throw new Error("Aborted");
  }

  const sink = new VideoSampleSink(videoTrack);

  for await (const videoSample of sink.samplesAtTimestamps(timestamps)) {
    try {
      if (signal?.aborted) {
        break;
      }

      if (!videoSample) {
        continue;
      }

      onVideoSample(videoSample);
    } finally {
      disposeResource(videoSample);
    }
  }
  } finally {
    disposeResource(input);
  }
}
