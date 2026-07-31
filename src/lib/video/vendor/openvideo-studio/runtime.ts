/*
 * Glue module written for Pictify (not part of the upstream app). The studio
 * panels (left tool rail + right properties panel) share the exact same
 * runtime as the vendored timeline island: one @openvideo/core instance, one
 * zustand studio store, one selection. Re-exporting from
 * ../openvideo-timeline/runtime guarantees a single module instance across
 * both islands (same Vite module graph), so canvas / timeline / panels stay
 * in sync automatically.
 *
 * setHostCallbacks wires page-level services (media upload) into the panels
 * without the vendored React code importing Svelte-side modules.
 */
export { core, projectStore, useStudioStore, setEditorContext } from "../openvideo-timeline/runtime";

export interface HostCallbacks {
  /**
   * Fired after a vendored panel mutates a clip's style. The studio store only
   * republishes on a SELECTION change, so the Svelte side needs a nudge to
   * re-read the clip (gradient stop bindings, the dirty flag).
   */
  onClipStyleChange?: (clipId: string) => void;
  /**
   * Upload a media file and resolve to a persistent URL. Implemented by the
   * Svelte page: images go to brand assets, video and audio to the video media
   * library. Falls back to an object URL only when the upload fails, which is
   * what `persistent: false` reports.
   */
  uploadMedia?: (
    file: File
  ) => Promise<{ url: string; persistent: boolean; uid?: string; bytes?: number }>;
  /**
   * Load the user's saved media. Called once on mount; the panels render a
   * loading state until it resolves.
   */
  loadMedia?: () => Promise<
    Array<{
      uid?: string;
      kind: "image" | "video" | "audio";
      name: string;
      url: string;
      bytes?: number;
      source?: "brand" | "library";
    }>
  >;
  /**
   * Remove an item from the library. Soft delete server-side: clips already
   * placed on a timeline keep working, because the file itself stays.
   */
  deleteMedia?: (uid: string) => Promise<void>;
  /**
   * Transcribe a media URL into word timings, for caption clips.
   *
   * The URL has to be publicly reachable: the transcription service fetches it
   * directly rather than streaming it through our server, which is what keeps a
   * 200MB source video off the API box.
   */
  transcribe?: (
    url: string
  ) => Promise<{ words: Array<{ text: string; from: number; to: number }>; text: string }>;
  /**
   * Search stock images or videos. Proxied server-side so the provider key is
   * never shipped to the browser. Rejects with a `code` of `stock_unavailable`
   * when the server has no key configured, which the panel shows as a setup
   * message rather than as a failure.
   */
  searchStock?: (
    kind: "image" | "video",
    query: string,
    page?: number
  ) => Promise<{ items: Array<any>; pagination: { hasMore: boolean; page: number } }>;
}

let hostCallbacks: HostCallbacks = {};

export function setHostCallbacks(callbacks: HostCallbacks) {
  hostCallbacks = callbacks || {};
}

export function getHostCallbacks(): HostCallbacks {
  return hostCallbacks;
}
