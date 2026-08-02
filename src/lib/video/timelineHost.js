/**
 * React island that hosts the vendored OpenVideo timeline panel
 * (src/lib/video/vendor/openvideo-timeline) under the editor canvas at
 * /dashboard/video-templates/[uid]/studio. Browser-only — always import this module
 * dynamically from onMount, never at the top level of a component that may
 * run in SSR (same contract as playerHost.js / editorHost.js).
 *
 * The timeline is NOT a second engine: mountTimelinePanel binds the vendored
 * React tree to the SAME @openvideo/core instance (and engine-pixi Studio)
 * that editorHost.js created, via setEditorContext. TimelineBridge +
 * studio-to-store-sync then keep canvas and timeline bidirectional:
 * drag/trim/split/reorder on the timeline dispatch core commands that the
 * Pixi canvas re-renders, and canvas edits/seeks reflect back on the
 * timeline and playhead.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { setEditorContext, useStudioStore } from './vendor/openvideo-timeline/runtime';
import Timeline from './vendor/openvideo-timeline/timeline';

const instances = new Map();

// Note: upstream draws canvas text with its "geist-regular" webfont, but the
// designcombo CDN serving it blocks cross-origin font loads, so we don't fetch
// it — the timeline canvas falls back to the browser's default sans face.

/**
 * Mount the timeline panel into `el`, bound to a live editor.
 *
 * @param {HTMLElement} el - Container element (should have a fixed height).
 * @param {Object} options
 * @param {Object} options.core - The @openvideo/core instance from editorHost.
 * @param {Object} options.studio - The engine-pixi Studio instance from editorHost.
 * @returns {{ destroy: () => void }}
 */
export const mountTimelinePanel = (el, { core, studio }) => {
	if (!core) throw new Error('mountTimelinePanel requires the editor core instance.');

	const previous = instances.get(el);
	if (previous) previous.destroy();

	setEditorContext({ core, studio: studio || null });

	const root = createRoot(el);
	root.render(React.createElement(Timeline));

	const handle = {
		destroy: () => {
			instances.delete(el);
			try {
				root.unmount();
			} catch (error) {
				// React teardown is best-effort; never break page navigation.
			}
			useStudioStore.getState().setStudio(null);
		}
	};
	instances.set(el, handle);
	return handle;
};
