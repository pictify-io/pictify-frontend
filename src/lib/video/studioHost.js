/**
 * React islands that host the vendored OpenVideo studio panels
 * (src/lib/video/vendor/openvideo-studio): the left tool rail (Text / Media /
 * Audio / Shapes) and the right properties panel at /dashboard/video-templates/[uid]/studio.
 * Browser-only — always import this module dynamically from onMount, never at
 * the top level of a component that may run in SSR (same contract as
 * editorHost.js / timelineHost.js).
 *
 * Both islands bind to the SAME @openvideo/core + Studio pair the canvas and
 * timeline use (shared runtime module → shared zustand store), so selection
 * made on the canvas or timeline drives the properties panel with no extra
 * wiring here.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { setEditorContext, setHostCallbacks } from './vendor/openvideo-studio/runtime';
import { resetMediaLibrary } from './vendor/openvideo-studio/use-media-library';
import ToolRail from './vendor/openvideo-studio/rail';
import PropertiesPanel from './vendor/openvideo-studio/properties/properties-panel';

const instances = new Map();

const mountIsland = (el, element) => {
	const previous = instances.get(el);
	if (previous) previous.destroy();

	const root = createRoot(el);
	root.render(element);

	const handle = {
		destroy: () => {
			instances.delete(el);
			try {
				root.unmount();
			} catch (error) {
				// React teardown is best-effort; never break page navigation.
			}
		}
	};
	instances.set(el, handle);
	return handle;
};

/**
 * Mount the left tool rail (vertical tabs + panel drawer).
 *
 * @param {HTMLElement} el
 * @param {Object} options
 * @param {Object} options.core - The @openvideo/core instance from editorHost.
 * @param {Object} options.studio - The engine-pixi Studio instance from editorHost.
 * @param {Function} [options.uploadMedia] - async (File) => { url, persistent, uid?, bytes? }
 * @param {Function} [options.loadMedia] - async () => MediaItem[], the user's saved
 *   media. Called once on mount to fill the library.
 * @param {Function} [options.deleteMedia] - async (uid) => void
 * @param {Function} [options.onClipStyleChange] - (clipId) => void, fired after a
 *   vendored panel mutates a clip's style (the gradient editor). The studio
 *   store only republishes on a selection change, so the Svelte side needs this
 *   to re-read the clip and re-run variable detection.
 * @param {Function} [options.transcribe] - async (url) => { words, text }, for
 *   the captions panel.
 * @param {Function} [options.searchStock] - async (kind, query, page) =>
 *   { items, pagination }, for the stock panel.
 * @returns {{ destroy: () => void }}
 */
export const mountToolRail = (
	el,
	{
		core,
		studio,
		uploadMedia,
		loadMedia,
		deleteMedia,
		onClipStyleChange,
		transcribe,
		searchStock
	}
) => {
	if (!core) throw new Error('mountToolRail requires the editor core instance.');
	setEditorContext({ core, studio: studio || null });
	/*
	 * Forwarded key by key rather than by spreading `options`, so the core and
	 * studio instances do not end up in the callback bag. That means every new
	 * callback has to be added HERE as well as to the caller — a panel whose
	 * callback is missing silently shows its "not available" state, which reads
	 * as a deliberate feature flag rather than as a dropped wire.
	 */
	setHostCallbacks({
		uploadMedia,
		loadMedia,
		deleteMedia,
		onClipStyleChange,
		transcribe,
		searchStock
	});
	const island = mountIsland(el, React.createElement(ToolRail));
	return {
		destroy: () => {
			island.destroy();
			// The media library is a module-level store, so it outlives this
			// mount. Clearing it means the next studio picks up assets added
			// elsewhere (the image editor's brand kit) instead of showing a list
			// that is only correct until someone uploads a logo in another tab.
			resetMediaLibrary();
		}
	};
};

/**
 * Mount the right properties panel for the selected clip.
 *
 * @param {HTMLElement} el
 * @param {Object} options
 * @param {Object} options.core
 * @param {Object} options.studio
 * @returns {{ destroy: () => void }}
 */
export const mountPropertiesPanel = (el, { core, studio }) => {
	if (!core) throw new Error('mountPropertiesPanel requires the editor core instance.');
	setEditorContext({ core, studio: studio || null });
	return mountIsland(el, React.createElement(PropertiesPanel));
};
