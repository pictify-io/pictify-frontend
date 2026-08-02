/**
 * Browser-only host for the OpenVideo engine (@openvideo/core +
 * @openvideo/engine-pixi, both MIT) that powers the timeline video studio at
 * /dashboard/video-templates/[uid]/studio. Follows the same mount-function contract as
 * playerHost.js — always import this module dynamically from onMount, never
 * at the top level of a component that may run in SSR.
 *
 * Unlike playerHost.js this needs no React at all: the OpenVideo engine is
 * framework-agnostic (PixiJS canvas + a vanilla zustand store), so the
 * Svelte page owns all chrome and talks to the engine through the handle
 * returned by mountVideoEditor.
 *
 * The editor document is a plain-JSON scene graph (IProject:
 * { settings, tracks, clips }) — exportProject()/importProject() round-trip
 * it, the backend persists it verbatim on VideoTemplate.projectJson, and the
 * exact same JSON is what a server render consumes (@openvideo/video-renderer).
 */
import { Core, CoreConfig, BrowserMetadataProvider } from '@openvideo/core';
import { Studio, Compositor } from '@openvideo/engine-pixi';

// Media metadata (duration, dimensions) is probed in the browser.
CoreConfig.setMetadataProvider(new BrowserMetadataProvider());

const MICROSECONDS_PER_SECOND = 1000000;

const DEFAULT_SETTINGS = {
	width: 1080,
	height: 1920,
	fps: 30,
	duration: 30 * MICROSECONDS_PER_SECOND
};

const instances = new Map();

/**
 * Mount the interactive editor canvas into `canvasEl` (a <canvas> element).
 *
 * @param {HTMLCanvasElement} canvasEl
 * @param {Object} options
 * @param {Object|null} [options.project] - IProject JSON to load, or null for a blank doc.
 * @param {number} [options.width] - Composition width (used when project is null).
 * @param {number} [options.height] - Composition height (used when project is null).
 * @param {number} [options.fps]
 * @param {string} [options.backgroundColor] - Backdrop color outside the artboard.
 * @param {Function} [options.onState] - Called with { currentTime, isPlaying, tracks, clips, settings } on every store change.
 * @param {Function} [options.onSelection] - Called with the selected clip array.
 * @param {Function} [options.onError]
 * @returns {Promise<Object>} editor handle (see below), or throws.
 */
export const mountVideoEditor = async (canvasEl, options = {}) => {
	const {
		project = null,
		width = DEFAULT_SETTINGS.width,
		height = DEFAULT_SETTINGS.height,
		fps = DEFAULT_SETTINGS.fps,
		backgroundColor = '#101014',
		onState,
		onSelection,
		onError
	} = options;

	// Remount on the same canvas replaces the previous instance.
	const previous = instances.get(canvasEl);
	if (previous) previous.destroy();

	const settings = project?.settings || { ...DEFAULT_SETTINGS, width, height, fps };

	const core = new Core({
		settings: {
			width: settings.width,
			height: settings.height,
			fps: settings.fps || fps,
			duration: settings.duration || DEFAULT_SETTINGS.duration
		}
	});

	const studio = new Studio({
		width: settings.width,
		height: settings.height,
		fps: settings.fps || fps,
		canvas: canvasEl,
		core,
		interactivity: true,
		spacing: 20,
		backgroundColor,
		artboardColor: '#000000',
		previewScale: 0.75
	});

	try {
		await studio.ready;
	} catch (error) {
		if (onError) onError(error?.message || String(error));
		throw error;
	}

	if (project) {
		try {
			core.project.import(project);
		} catch (error) {
			if (onError) onError(`Could not load the saved project: ${error?.message || error}`);
		}
	}

	// ── Store → UI sync ──────────────────────────────────────────────────
	let unsubscribe = null;
	if (onState) {
		const push = (state) =>
			onState({
				currentTime: state.currentTime,
				isPlaying: state.isPlaying,
				tracks: state.tracks,
				clips: state.clips,
				settings: state.settings,
				// Undo/redo availability. Derived from the store's own stacks
				// rather than the Studio's `history:changed` event, which does not
				// fire reliably — verified in the dev harness: after an undo the
				// store read history=0/future=1 while the event still reported
				// canUndo=true, canRedo=false.
				canUndo: (state.history?.length || 0) > 0,
				canRedo: (state.future?.length || 0) > 0
			});
		unsubscribe = core.store.subscribe(push);
		push(core.store.getState());
	}

	const selectionEvents = ['selection:created', 'selection:updated', 'selection:cleared'];
	const selectionHandler = (payload) => {
		if (onSelection) onSelection(payload?.selected || []);
	};
	if (onSelection) {
		selectionEvents.forEach((event) => studio.on?.(event, selectionHandler));
	}

	const handle = {
		core,
		studio,

		// ── Playback ─────────────────────────────────────────────────────
		play: () => core.play(),
		pause: () => core.pause(),
		toggle: () => core.playback.toggle(),
		/** @param {number} timeUs microseconds */
		seek: (timeUs) => core.seek(Math.max(0, timeUs)),

		// ── Document ─────────────────────────────────────────────────────
		exportProject: () => core.project.export(),
		importProject: (json) => core.project.import(json),
		undo: () => core.undo(),
		redo: () => core.redo(),

		// ── Clip helpers (thin wrappers over the command API) ────────────
		addText: (text = 'Your text', style = {}) =>
			core.clip.add({
				type: 'Text',
				text,
				style: { fontSize: 96, fill: '#ffffff', align: 'center', ...style },
				timing: {
					display: { from: 0, to: 4 * MICROSECONDS_PER_SECOND }
				}
			}),
		addImage: (src, name = 'Image') =>
			core.clip.add(
				{
					type: 'Image',
					src,
					name,
					timing: { display: { from: 0, to: 5 * MICROSECONDS_PER_SECOND } }
				},
				{ objectFit: 'contain' }
			),
		addVideo: (src, name = 'Video') =>
			core.clip.add({ type: 'Video', src, name }, { objectFit: 'contain' }),
		addAudio: (src, name = 'Audio') => core.clip.add({ type: 'Audio', src, name }),
		updateClip: (id, updates) => core.clip.update(id, updates),
		removeClips: (ids) => core.clip.remove(ids),
		splitAtPlayhead: () => core.clip.split(),

		/** Client-side export support (WebCodecs). Server render works regardless. */
		isClientExportSupported: () => Compositor.isSupported(),

		/**
		 * Re-fit the Pixi renderer + artboard to the canvas container's current
		 * size. The engine auto-handles window resizes (Pixi `resizeTo` on the
		 * canvas parent) but not container-only resizes (panel drawer toggles,
		 * timeline dock drags) — call this from a ResizeObserver for those.
		 * NOTE: studio.setSize() is NOT this — it changes the composition
		 * (artboard) dimensions, not the viewport.
		 */
		resize: () => {
			try {
				studio.updateArtboardLayout();
			} catch (error) {
				// Best-effort: an in-flight render tick can reject a resize.
			}
		},

		destroy: () => {
			if (unsubscribe) unsubscribe();
			selectionEvents.forEach((event) => studio.off?.(event, selectionHandler));
			try {
				studio.destroy?.();
			} catch (error) {
				// Pixi teardown is best-effort; never break page navigation.
			}
			instances.delete(canvasEl);
		}
	};

	instances.set(canvasEl, { destroy: handle.destroy });
	return handle;
};

export { MICROSECONDS_PER_SECOND };
