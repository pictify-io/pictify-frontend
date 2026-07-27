/*
 * Written for Pictify (not part of the upstream app). Session store for the
 * Media / Audio panels: uploaded items live here so they survive tab
 * switches inside the editor. Items with `persistent: false` are blob object
 * URLs — they work for editing in this browser session but will not survive
 * reload or server-side render (see uploadMedia in the page host).
 */
import { create } from "zustand";

export type MediaKind = "image" | "video" | "audio";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  url: string;
  persistent: boolean;
}

interface MediaLibraryState {
  items: MediaItem[];
  addItem: (item: MediaItem) => void;
  setItems: (items: MediaItem[]) => void;
}

export const useMediaLibrary = create<MediaLibraryState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  setItems: (items) => set({ items }),
}));

export const kindForFile = (file: File): MediaKind | null => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
};
