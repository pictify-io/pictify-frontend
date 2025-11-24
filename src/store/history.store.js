import { writable } from 'svelte/store';

export const canUndo = writable(false);
export const canRedo = writable(false);

// These are used to trigger actions from the UI (TopBar) to the Canvas
export const triggerUndo = writable(0);
export const triggerRedo = writable(0);
