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
   * Upload a media file and resolve to a persistent URL. Implemented by the
   * Svelte page (Pictify brand-assets upload for images; object-URL fallback
   * for kinds the backend cannot store yet).
   */
  uploadMedia?: (file: File) => Promise<{ url: string; persistent: boolean }>;
}

let hostCallbacks: HostCallbacks = {};

export function setHostCallbacks(callbacks: HostCallbacks) {
  hostCallbacks = callbacks || {};
}

export function getHostCallbacks(): HostCallbacks {
  return hostCallbacks;
}
