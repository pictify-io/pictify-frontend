/*
 * Glue module written for Pictify (not part of the upstream app). It replaces
 * the upstream `@/lib/project` and `@/stores/studio-store` modules: instead of
 * creating its own Core singleton, it is initialised with the SAME
 * @openvideo/core instance (and engine-pixi Studio) that
 * src/lib/video/editorHost.js creates, so the vendored timeline and the
 * editor canvas stay in sync through one store.
 *
 * ES-module live bindings make `core` / `projectStore` update for every
 * importer once setEditorContext() runs — timelineHost.js calls it before the
 * first React render.
 */
import { create } from "zustand";
import type { Core } from "@openvideo/core";
import type { Studio, IClip } from "@openvideo/engine-pixi";

export let core: Core;
export let projectStore: Core["store"];

interface StudioState {
  studio: Studio | null;
  setStudio: (studio: Studio | null) => void;
  selectedClips: IClip[];
  setSelectedClips: (clips: IClip[]) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  studio: null,
  setStudio: (studio) => set({ studio }),
  selectedClips: [],
  setSelectedClips: (clips) => set({ selectedClips: clips }),
}));

/**
 * Bind the vendored timeline to a live editor. Must be called before the
 * timeline React tree renders.
 */
export function setEditorContext(options: { core: Core; studio: Studio | null }) {
  core = options.core;
  projectStore = options.core.store;
  useStudioStore.getState().setStudio(options.studio);
}
