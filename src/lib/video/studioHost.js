/**
 * React islands that host the vendored OpenVideo studio panels
 * (src/lib/video/vendor/openvideo-studio): the left tool rail (Text / Media /
 * Audio / Shapes) and the right properties panel at /dashboard/video-editor.
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
 * @param {Function} [options.uploadMedia] - async (File) => { url, persistent }
 * @returns {{ destroy: () => void }}
 */
export const mountToolRail = (el, { core, studio, uploadMedia }) => {
	if (!core) throw new Error('mountToolRail requires the editor core instance.');
	setEditorContext({ core, studio: studio || null });
	setHostCallbacks({ uploadMedia });
	return mountIsland(el, React.createElement(ToolRail));
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
