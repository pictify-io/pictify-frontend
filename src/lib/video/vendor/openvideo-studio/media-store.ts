/*
 * Written for Pictify (not part of the upstream app). Backing store for the
 * Media / Audio panels.
 *
 * Items come from two places:
 *
 *   - The server, on mount. Brand images (logos, icons, imagery) plus footage
 *     and audio from the user's video media library. These are `persistent`
 *     and survive reload, other browsers, and a headless server render.
 *
 *   - This session, from an upload. Normally these are persistent too — the
 *     host uploads to S3 before adding them. A `persistent: false` item is a
 *     blob: object URL, the fallback when the upload FAILED: it works for
 *     editing right now but dies on reload and a server render can never fetch
 *     it. The panels label those so the difference isn't a silent surprise at
 *     export time.
 */
import { create } from "zustand";

export type MediaKind = "image" | "video" | "audio";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  url: string;
  persistent: boolean;
  /** Server-side handle. Absent on session-only (failed-upload) items. */
  uid?: string;
  bytes?: number;
  /** Brand-kit items are shown but not deletable from the studio. */
  source?: "brand" | "library" | "session";
}

interface MediaLibraryState {
  items: MediaItem[];
  /** True while the initial server fetch is in flight. */
  loading: boolean;
  /** Set once the server has answered, successfully or not. */
  hydrated: boolean;
  /** Non-empty when the library could not be loaded. */
  error: string;
  addItem: (item: MediaItem) => void;
  setItems: (items: MediaItem[]) => void;
  removeItem: (id: string) => void;
  /** Put an item back where it was — used to undo a failed delete. */
  insertItem: (item: MediaItem, index: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  /** Replace the server-backed items, keeping anything added this session. */
  hydrate: (items: MediaItem[]) => void;
}

export const useMediaLibrary = create<MediaLibraryState>((set) => ({
  items: [],
  loading: false,
  hydrated: false,
  error: "",
  addItem: (item) =>
    set((state) => ({
      // A re-upload of the same file should move to the front, not appear
      // twice — the user has no way to tell the two rows apart.
      items: [item, ...state.items.filter((i) => i.url !== item.url)],
    })),
  setItems: (items) => set({ items }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  insertItem: (item, index) =>
    set((state) => {
      const items = state.items.filter((i) => i.id !== item.id);
      items.splice(Math.max(0, Math.min(index, items.length)), 0, item);
      return { items };
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  hydrate: (incoming) =>
    set((state) => {
      // Hydration can land after the user has already dropped a file in. Keep
      // session items and drop any server row with the same URL, so a file
      // uploaded seconds ago doesn't come back as a duplicate.
      const session = state.items.filter((i) => i.source === "session");
      const sessionUrls = new Set(session.map((i) => i.url));
      return {
        items: [...session, ...incoming.filter((i) => !sessionUrls.has(i.url))],
        loading: false,
        hydrated: true,
        error: "",
      };
    }),
}));

export const kindForFile = (file: File): MediaKind | null => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
};

/** Human-readable file size for the library rows. */
export const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
