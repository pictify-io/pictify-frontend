<script>
	/**
	 * VideoStudio — the timeline authoring surface for a video template.
	 *
	 * This is the front door for video in Pictify. It replaced /dashboard/video-editor,
	 * which was unreachable from the app and saved to a separate "video project"
	 * noun that nothing else could render. Now it authors a VideoTemplate
	 * (kind: 'timeline') — the same entity the render page, the workflow engine
	 * and the public API already understand.
	 *
	 * Composition:
	 *   - The canvas, timeline, tool rail and clip-properties panel come from
	 *     @openvideo (engine + vendored UI). They share ONE core/studio pair, so
	 *     selection made anywhere drives everything.
	 *   - Everything Pictify-specific — the top bar, variables, fill-values
	 *     preview, saving, export — is Svelte and lives here.
	 *
	 * Variables reach a scene two ways, mirrored exactly on the backend
	 * (service/openvideo-variables.js):
	 *   1. `{{token}}` typed into a text clip, auto-detected and auto-declared.
	 *   2. A binding declared on a clip field that can't hold a token.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	import { analytics } from '$lib/analytics.js';
	import {
		createVideoTemplate,
		updateVideoTemplate,
		renderVideoTemplate,
		uploadVideoMedia
	} from '../../../api/videoTemplates';
	import { uploadBrandAsset } from '../../../api/brand-assets';
	import VideoVariablesPanel from './VideoVariablesPanel.svelte';
	import ClipBindingsPanel from './ClipBindingsPanel.svelte';
	import {
		detectReferences,
		detectTokens,
		reconcileDefinitions,
		computeOverlayPatches,
		applyVariables,
		resolveValues,
		missingRequired,
		withBinding,
		pruneBindings,
		stripToken,
		clipList,
		bindingsForClip,
		humanizeName,
		makeDefinition,
		TOKEN_RE
	} from '$lib/video/variables.js';
	import {
		STAGE,
		PANEL,
		HEADING,
		LABEL,
		TEXT_MUTED,
		TEXT_FAINT,
		BUTTON_PRIMARY,
		BUTTON_SECONDARY,
		BUTTON_COMPACT,
		BUTTON_ICON,
		CHIP_NEUTRAL,
		CHIP_ACCENT,
		CARD,
		Z
	} from '$lib/video/studio-ui.js';

	/**
	 * The template being edited, or null for a new one. A new template has no
	 * uid until its first save, which is when the URL swaps to /[uid]/studio.
	 * @type {Object|null}
	 */
	export let template = null;

	// ── Element refs ─────────────────────────────────────────────────────
	let canvasEl;
	let canvasWrapEl;
	let timelineEl;
	let railEl;
	let propsEl;

	// ── Engine handles ───────────────────────────────────────────────────
	let editor = null;
	let timelinePanel = null;
	let toolRail = null;
	let propertiesPanel = null;
	let studioRuntime = null;
	let unsubscribeSelection = null;

	let mountError = '';
	let isBooting = true;

	// ── Document state ───────────────────────────────────────────────────
	let uid = template?.uid || null;
	let name = template?.name || 'Untitled video';
	let status = template?.status || 'draft';
	let posterUrl = template?.posterUrl || '';
	let variableDefinitions = (template?.variableDefinitions || []).map((v) => ({
		...v,
		validation: { required: false, ...(v.validation || {}) }
	}));

	let isDirty = false;
	let trackDirty = false;
	let suppressDirty = false;
	let lastClips = null;
	let lastTracks = null;

	let isSaving = false;
	let saveMessage = '';
	let saveError = '';

	// ── Variables state ──────────────────────────────────────────────────
	let testValues = {};
	let autoAdded = [];
	let explicitlyDeleted = new Set();
	let usage = {};
	let detectTimer = null;
	// Same debounce as the HTML editor: without it, typing "customer" declares
	// `c`, `cu`, `cus` … as you go.
	const DETECT_DEBOUNCE_MS = 400;

	// ── Fill-values preview ──────────────────────────────────────────────
	let filling = false;
	let authoredDoc = null;
	let overlayApplied = [];

	// ── Selection ────────────────────────────────────────────────────────
	let selectedClip = null;

	// ── History ──────────────────────────────────────────────────────────
	// Derived from the engine store's own history/future stacks (pushed through
	// onState by editorHost), so the buttons reflect the real undo depth.
	let canUndo = false;
	let canRedo = false;

	// ── Panels ───────────────────────────────────────────────────────────
	let activeTab = 'properties'; // properties | variables

	// ── Export ───────────────────────────────────────────────────────────
	let clientExportSupported = false;
	let isExporting = false;
	let exportProgress = 0;
	let exportStage = '';
	let exportError = '';
	let renderUrl = '';
	let exportController = null;

	// ── Media notices ────────────────────────────────────────────────────
	let mediaWarning = '';

	// ── Timeline dock resize ─────────────────────────────────────────────
	const TIMELINE_MIN_HEIGHT = 180;
	const TIMELINE_MAX_HEIGHT = 520;
	let timelineHeight = 280;
	let resizePointerId = null;
	let resizeStartY = 0;
	let resizeStartHeight = 0;

	const startTimelineResize = (event) => {
		resizePointerId = event.pointerId;
		resizeStartY = event.clientY;
		resizeStartHeight = timelineHeight;
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const moveTimelineResize = (event) => {
		if (resizePointerId === null) return;
		const next = resizeStartHeight + (resizeStartY - event.clientY);
		timelineHeight = Math.min(TIMELINE_MAX_HEIGHT, Math.max(TIMELINE_MIN_HEIGHT, next));
	};
	const endTimelineResize = () => {
		resizePointerId = null;
	};

	// The Pixi renderer keeps its mount-time pixel size, and auto-handles only
	// window resizes — not container-only ones (panel toggles, dock drags).
	let resizeObserver = null;
	let resizeRaf = 0;
	const observeCanvasResize = () => {
		if (typeof ResizeObserver === 'undefined' || !canvasWrapEl) return;
		resizeObserver = new ResizeObserver(() => {
			if (!editor) return;
			cancelAnimationFrame(resizeRaf);
			resizeRaf = requestAnimationFrame(() => editor.resize());
		});
		resizeObserver.observe(canvasWrapEl);
	};

	// ── Media upload ─────────────────────────────────────────────────────
	// Everything a timeline references must be a real, public URL: a blob: URL
	// dies on reload and a server render can never fetch it.
	const uploadMedia = async (file) => {
		mediaWarning = '';
		try {
			if (file.type.startsWith('image/')) {
				const response = await uploadBrandAsset(file, { type: 'image', name: file.name });
				const url = response?.asset?.url;
				if (url) return { url, persistent: true };
				throw new Error('The upload returned no URL.');
			}
			const response = await uploadVideoMedia(file);
			const url = response?.media?.url;
			if (url) return { url, persistent: true };
			throw new Error('The upload returned no URL.');
		} catch (error) {
			// Fall back to a session-local URL so the user can keep working, but
			// say so — this file will not survive a reload or a server render.
			mediaWarning =
				error?.message ||
				`${file.name} could not be uploaded. It will work in this session but not after a reload.`;
			return { url: URL.createObjectURL(file), persistent: false };
		}
	};

	// ── Mount ────────────────────────────────────────────────────────────
	onMount(async () => {
		analytics.page('Video Studio');
		try {
			// Browser-only engines — never import at module top level (SSR).
			const { mountVideoEditor } = await import('$lib/video/editorHost.js');
			editor = await mountVideoEditor(canvasEl, {
				project: template?.projectJson || null,
				width: template?.width,
				height: template?.height,
				fps: template?.fps,
				backgroundColor: '#0a0a0c',
				onState: (state) => {
					canUndo = state.canUndo;
					canRedo = state.canRedo;
					if (trackDirty && (state.clips !== lastClips || state.tracks !== lastTracks)) {
						if (!suppressDirty) {
							markDirty();
							// A real user edit while previewing: keep the authored copy
							// in step so exiting preview doesn't revert it and saving
							// doesn't persist a pre-edit document.
							if (filling) recaptureAuthored();
						}
						scheduleDetect();
					}
					lastClips = state.clips;
					lastTracks = state.tracks;
				},
				onError: (message) => {
					mountError = message;
				}
			});
			trackDirty = true;

			if (import.meta.env.DEV) window.__videoEditor = editor;

			const { mountTimelinePanel } = await import('$lib/video/timelineHost.js');
			timelinePanel = mountTimelinePanel(timelineEl, {
				core: editor.core,
				studio: editor.studio
			});

			const { mountToolRail, mountPropertiesPanel } = await import('$lib/video/studioHost.js');
			toolRail = mountToolRail(railEl, {
				core: editor.core,
				studio: editor.studio,
				uploadMedia,
				// The vendored gradient editor mutates a clip's style directly; the
				// studio store only republishes on a SELECTION change, so it tells us
				// when to re-read the clip and re-detect variables.
				onClipStyleChange: (clipId) => {
					const updated = editor.core.store.getState().clips?.[clipId];
					if (updated && selectedClip?.id === clipId) selectedClip = { ...updated };
					markDirty();
					scheduleDetect();
				}
			});
			propertiesPanel = mountPropertiesPanel(propsEl, {
				core: editor.core,
				studio: editor.studio
			});

			// The vendored panels keep selection in a zustand store. Subscribe so
			// the Svelte side (bindings panel) sees the same selection.
			studioRuntime = await import('$lib/video/vendor/openvideo-studio/runtime');
			const readSelection = (state) => {
				selectedClip = state?.selectedClips?.length === 1 ? state.selectedClips[0] : null;
			};
			unsubscribeSelection = studioRuntime.useStudioStore.subscribe(readSelection);
			readSelection(studioRuntime.useStudioStore.getState());

			observeCanvasResize();
			runDetect();

			const { isClientExportSupported } = await import('$lib/video/exportHost.js');
			clientExportSupported = await isClientExportSupported({
				width: template?.width,
				height: template?.height
			});
		} catch (error) {
			mountError = error?.message || 'The studio failed to start.';
		} finally {
			isBooting = false;
		}
	});

	onDestroy(() => {
		if (resizeObserver) resizeObserver.disconnect();
		cancelAnimationFrame(resizeRaf);
		clearTimeout(detectTimer);
		if (exportController) exportController.abort();
		if (unsubscribeSelection) unsubscribeSelection();
		if (toolRail) toolRail.destroy();
		if (propertiesPanel) propertiesPanel.destroy();
		if (timelinePanel) timelinePanel.destroy();
		if (editor) editor.destroy();
	});

	// Losing work to a stray back-button was a real hole: the old editor only
	// painted the words "Unsaved changes" and let you leave.
	beforeNavigate(({ cancel, willUnload }) => {
		if (!isDirty || isSaving) return;
		if (willUnload) return; // the beforeunload handler covers this case
		if (!confirm('You have unsaved changes. Leave the studio and lose them?')) cancel();
	});

	function undo() {
		editor?.undo();
		markDirty();
		scheduleDetect();
	}

	function redo() {
		editor?.redo();
		markDirty();
		scheduleDetect();
	}

	const markDirty = () => {
		isDirty = true;
		saveMessage = '';
	};

	// ── Variable detection ───────────────────────────────────────────────
	function scheduleDetect() {
		clearTimeout(detectTimer);
		detectTimer = setTimeout(runDetect, DETECT_DEBOUNCE_MS);
	}

	function runDetect() {
		if (!editor || filling) return;
		let doc;
		try {
			doc = editor.exportProject();
		} catch (error) {
			return;
		}

		const referenced = detectReferences(doc);
		const result = reconcileDefinitions(variableDefinitions, referenced, {
			autoAdded,
			explicitlyDeleted
		});

		if (result.added.length || result.removed.length) {
			variableDefinitions = result.definitions;
			autoAdded = result.autoAdded;
			if (result.added.length) {
				analytics.track?.('Video Variable Auto Detected', {
					uid,
					names: result.added
				});
			}
		}
		usage = computeUsage(doc);
	}

	/** Per-variable counts of tokens and bindings, for the panel's usage line. */
	function computeUsage(doc) {
		const stats = {};
		const bump = (name, key) => {
			if (!stats[name]) stats[name] = { tokens: 0, bindings: 0 };
			stats[name][key] += 1;
		};
		for (const clip of clipList(doc)) {
			if (typeof clip?.text === 'string') {
				for (const match of clip.text.matchAll(TOKEN_RE)) bump(match[1], 'tokens');
			}
			for (const binding of bindingsForClip(clip)) {
				if (binding?.variable) bump(binding.variable, 'bindings');
			}
		}
		return stats;
	}

	function onVariablesChange(event) {
		// Only a DEFINITION change touches the template. testValues are an
		// ephemeral preview overlay and are never persisted, so typing one must
		// not put the studio in an unsaved state (or trip the leave guard).
		const definitionsChanged =
			JSON.stringify(event.detail.variableDefinitions) !== JSON.stringify(variableDefinitions);
		variableDefinitions = event.detail.variableDefinitions;
		testValues = event.detail.testValues;
		if (definitionsChanged) markDirty();
		if (filling) refreshOverlay();
	}

	function onAckAutoAdded() {
		autoAdded = [];
	}

	/** A rename has to follow the variable into the document. */
	function onVariableRename(event) {
		const { from, to } = event.detail;
		if (!editor || !from || !to) return;
		withAuthoredDocument(() => renameVariable(from, to));
	}

	function renameVariable(from, to) {
		const doc = editor.exportProject();
		const renameRe = new RegExp(`\\{\\{\\s*${from}\\s*\\}\\}`, 'g');

		for (const clip of clipList(doc)) {
			if (!clip?.id) continue;
			let touched = false;
			const updates = {};

			if (typeof clip.text === 'string' && renameRe.test(clip.text)) {
				renameRe.lastIndex = 0;
				updates.text = clip.text.replace(renameRe, `{{${to}}}`);
				touched = true;
			}
			const bindings = bindingsForClip(clip);
			if (bindings.some((b) => b.variable === from)) {
				updates.metadata = {
					...(clip.metadata || {}),
					pictify: {
						...(clip.metadata?.pictify || {}),
						bindings: bindings.map((b) => (b.variable === from ? { ...b, variable: to } : b))
					}
				};
				touched = true;
			}
			if (touched) editor.core.clip.update(clip.id, updates);
		}
		explicitlyDeleted.delete(to);
		runDetect();
	}

	/**
	 * Deleting a variable that is still referenced would leave the document
	 * rendering a literal `{{name}}`. Confirm, then clean the document.
	 */
	function onRequestRemove(event) {
		const { names } = event.detail;
		if (!editor || !names?.length) return;
		withAuthoredDocument(() => removeVariables(names));
	}

	function removeVariables(names) {
		const doc = editor.exportProject();

		const stillUsed = names.filter((name) => {
			const stat = usage[name];
			return stat && (stat.tokens || stat.bindings);
		});
		if (stillUsed.length) {
			const label = stillUsed.map((n) => `"${n}"`).join(', ');
			const ok = confirm(
				`${label} ${stillUsed.length === 1 ? 'is' : 'are'} still used in this video.\n\n` +
					'Deleting will replace the tokens with plain text and drop the bindings. Continue?'
			);
			if (!ok) return;
		}

		for (const name of names) {
			const definition = variableDefinitions.find((v) => v.name === name);
			// Replace with the default so the clip never goes blank on the canvas.
			const replacement = definition?.defaultValue || humanizeName(name);
			for (const clip of clipList(doc)) {
				if (typeof clip?.text !== 'string' || !clip.id) continue;
				const re = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g');
				if (!re.test(clip.text)) continue;
				re.lastIndex = 0;
				editor.core.clip.update(clip.id, { text: clip.text.replace(re, replacement) });
			}
			for (const clip of clipList(doc)) {
				if (!clip?.id) continue;
				const bindings = bindingsForClip(clip);
				if (!bindings.some((b) => b.variable === name)) continue;
				editor.core.clip.update(clip.id, {
					metadata: {
						...(clip.metadata || {}),
						pictify: {
							...(clip.metadata?.pictify || {}),
							bindings: bindings.filter((b) => b.variable !== name)
						}
					}
				});
			}
			explicitlyDeleted.add(name);
		}

		variableDefinitions = variableDefinitions.filter((v) => !names.includes(v.name));
		autoAdded = autoAdded.filter((n) => !names.includes(n));
		const nextValues = { ...testValues };
		for (const name of names) delete nextValues[name];
		testValues = nextValues;
		markDirty();
		runDetect();
	}

	// ── Bindings ─────────────────────────────────────────────────────────
	function applyBinding(clipId, target, variable) {
		if (!editor || !clipId) return;
		// clip.update SHALLOW-assigns unknown keys, so metadata must be rebuilt
		// from the live value or everything else on it is lost.
		const live = editor.core.store.getState().clips?.[clipId];
		if (!live) return;
		editor.core.clip.update(clipId, { metadata: withBinding(live, target, variable) });
		// The studio store only re-publishes on a SELECTION change, so re-read the
		// clip by hand — otherwise the panel keeps showing the pre-bind state until
		// the user reselects.
		const updated = editor.core.store.getState().clips?.[clipId];
		if (updated && selectedClip?.id === clipId) selectedClip = { ...updated };
		markDirty();
		runDetect();
	}

	function onBind(event) {
		if (!selectedClip?.id) return;
		applyBinding(selectedClip.id, event.detail.target, event.detail.variable);
		analytics.track?.('Video Variable Bound', { uid, target: event.detail.target });
	}

	/** "+ New variable" in the bindings panel: declare it and bind it in one go. */
	function onCreateAndBind(event) {
		if (!selectedClip?.id) return;
		const { target, type } = event.detail;

		const base = target.split('.').pop();
		let name = base;
		let n = 2;
		while (variableDefinitions.some((v) => v.name === name)) {
			name = `${base}${n}`;
			n += 1;
		}

		// A media clip whose src is empty gets DROPPED on import, so an image
		// variable's default doubles as the design-time placeholder: seed it
		// from whatever the clip is showing right now.
		const live = editor.core.store.getState().clips?.[selectedClip.id];
		let defaultValue = '';
		if (type === 'image' || type === 'video' || type === 'audio') defaultValue = live?.src || '';
		else if (type === 'color') defaultValue = live?.style?.fill || '#ffc480';

		variableDefinitions = [...variableDefinitions, makeDefinition(name, type, defaultValue)];
		explicitlyDeleted.delete(name);
		applyBinding(selectedClip.id, target, name);
		activeTab = 'variables';
		analytics.track?.('Video Variable Added', { uid, via: 'binding', type });
	}

	// ── Fill-values preview ──────────────────────────────────────────────
	// A targeted overlay, not a document swap: clip.update is the same call the
	// properties panel makes constantly, so it is known-safe, and restoring is
	// symmetric. Importing a whole document instead would re-normalize every
	// clip and disturb undo history.
	//
	// The subtlety is that the canvas stays editable while previewing. Two rules
	// keep that honest:
	//   1. `authoredDoc` is RE-DERIVED from the live document after every user
	//      edit (recaptureAuthored), so it never goes stale. Without that, a
	//      clip moved during preview would be reverted on exit, and a save
	//      during preview would persist a document from before the edit.
	//   2. Anything that needs the authored document — save, delete, rename —
	//      leaves preview first (withAuthoredDocument).

	/**
	 * Rebuild `authoredDoc` from the live document by undoing the overlay in a
	 * clone. Called after a user edit during preview so the authored copy keeps
	 * up with edits while still holding the tokens rather than the values.
	 */
	function recaptureAuthored() {
		if (!editor || !filling) return;
		const doc = structuredClone(editor.exportProject());
		const byId = new Map(clipList(doc).map((clip) => [clip.id, clip]));
		for (const { clipId, restore } of overlayApplied) {
			const clip = byId.get(clipId);
			// `restore` carries whole sub-objects (style, timing, transform), so a
			// top-level assign is enough to undo the patch exactly.
			if (clip) Object.assign(clip, restore);
		}
		authoredDoc = doc;
	}

	async function startFilling() {
		if (!editor || filling) return;
		authoredDoc = editor.exportProject();
		const patches = computeOverlayPatches(authoredDoc, testValues, variableDefinitions);
		if (!patches.length) {
			exportError = '';
			saveMessage = 'Nothing to preview yet — add a {{token}} or a binding first.';
			return;
		}
		suppressDirty = true;
		overlayApplied = patches;
		for (const { clipId, patch } of patches) editor.core.clip.update(clipId, patch);
		filling = true;
		await tick();
		suppressDirty = false;
		analytics.track?.('Video Fill Values Preview', { uid });
	}

	function refreshOverlay() {
		if (!editor || !filling || !authoredDoc) return;
		suppressDirty = true;
		// Restore first so a changed value doesn't stack on the previous one.
		for (const { clipId, restore } of overlayApplied) editor.core.clip.update(clipId, restore);
		const patches = computeOverlayPatches(authoredDoc, testValues, variableDefinitions);
		overlayApplied = patches;
		for (const { clipId, patch } of patches) editor.core.clip.update(clipId, patch);
		tick().then(() => {
			suppressDirty = false;
		});
	}

	async function stopFilling() {
		if (!editor || !filling) return;
		suppressDirty = true;
		for (const { clipId, restore } of overlayApplied) editor.core.clip.update(clipId, restore);
		overlayApplied = [];
		authoredDoc = null;
		filling = false;
		await tick();
		suppressDirty = false;
		runDetect();
	}

	const toggleFilling = () => (filling ? stopFilling() : startFilling());

	/**
	 * Run `fn` against the authored document, leaving preview first if needed
	 * and restoring it afterwards. Every operation that reads or rewrites the
	 * document (save, delete a variable, rename a variable) goes through this —
	 * reading `exportProject()` during preview would see substituted VALUES
	 * where the tokens should be, and would burn them into the template.
	 */
	async function withAuthoredDocument(fn) {
		const wasFilling = filling;
		if (wasFilling) await stopFilling();
		try {
			return await fn();
		} finally {
			if (wasFilling) await startFilling();
		}
	}

	// ── Save ─────────────────────────────────────────────────────────────
	/** The document as it should be persisted: authored, not filled. */
	function documentToSave() {
		// structuredClone unconditionally: core.project.export() shallow-copies,
		// so its clips share `metadata` with the live store and pruneBindings
		// would otherwise mutate the running editor.
		const doc = structuredClone(filling ? authoredDoc : editor.exportProject());
		// Never persist a binding to a variable that no longer exists.
		pruneBindings(doc, new Set(variableDefinitions.map((v) => v.name)));
		return doc;
	}

	// Set when a brand-new template was saved mid-export; the URL swap happens
	// once the user is done looking at the result.
	let pendingUrlAdoption = false;

	function dismissRender() {
		renderUrl = '';
		if (pendingUrlAdoption) {
			pendingUrlAdoption = false;
			adoptPermanentUrl();
		}
	}

	async function save(options = {}) {
		// Leave preview first: the persisted document must hold the tokens, and
		// any edit made during preview has to be in it.
		if (filling) return withAuthoredDocument(() => persist(options));
		return persist(options);
	}

	/**
	 * Move a freshly created template onto its permanent URL.
	 *
	 * /new/studio and /[uid]/studio are different route nodes, so this REMOUNTS
	 * the component and tears down the engine. That is fine after a save, and
	 * fatal in the middle of a render — hence `deferNavigation`.
	 */
	async function adoptPermanentUrl() {
		if (!uid) return;
		await goto(`/dashboard/video-templates/${uid}/studio`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true,
			invalidateAll: false
		});
	}

	async function persist({ publish = false, silent = false, deferNavigation = false } = {}) {
		if (!editor || isSaving) return null;
		isSaving = true;
		saveError = '';
		if (!silent) saveMessage = '';

		try {
			const projectJson = documentToSave();
			const settings = projectJson?.settings || {};
			const fps = Math.max(1, Math.round(settings.fps || 30));
			const durationUs = Number(settings.duration) || 0;
			const durationInFrames = Math.max(1, Math.round((durationUs / 1_000_000) * fps));

			const payload = {
				name: name.trim() || 'Untitled video',
				projectJson,
				variableDefinitions,
				width: Math.round(settings.width || template?.width || 1080),
				height: Math.round(settings.height || template?.height || 1920),
				fps,
				durationInFrames,
				status: publish ? 'published' : status
			};

			// Best-effort poster so the list stops showing identical cards. It is
			// UPLOADED, not inlined: `posterUrl` is a URL column, and a data URL
			// would be tens of KB on every template and on every list response.
			// Never let a thumbnail failure block a save.
			try {
				const { snapshotThumbnail } = await import('$lib/video/exportHost.js');
				const dataUrl = await snapshotThumbnail(projectJson);
				if (dataUrl) {
					const blob = await (await fetch(dataUrl)).blob();
					const posterFile = new File([blob], 'poster.jpg', { type: 'image/jpeg' });
					const uploaded = await uploadVideoMedia(posterFile);
					if (uploaded?.media?.url) payload.posterUrl = uploaded.media.url;
				}
			} catch (error) {
				/* the template saves fine without one */
			}

			let saved;
			if (uid) {
				const response = await updateVideoTemplate(uid, payload);
				saved = response?.template;
			} else {
				const response = await createVideoTemplate({ ...payload, kind: 'timeline' });
				saved = response?.template;
			}
			if (!saved?.uid) throw new Error('The template saved but no details came back.');

			uid = saved.uid;
			status = saved.status || payload.status;
			posterUrl = saved.posterUrl || payload.posterUrl || posterUrl;
			isDirty = false;
			saveMessage = publish ? 'Published' : 'Saved';

			analytics.track?.(publish ? 'Video Template Published' : 'Video Template Saved', {
				uid,
				kind: 'timeline',
				variables: variableDefinitions.length
			});

			if (!template?.uid && !deferNavigation) {
				await adoptPermanentUrl();
			}
			return uid;
		} catch (error) {
			saveError = error?.message || 'The save failed. Please try again.';
			return null;
		} finally {
			isSaving = false;
		}
	}

	// ── Export ───────────────────────────────────────────────────────────
	/**
	 * Render in the browser when WebCodecs is available: it runs on the user's
	 * GPU, costs the server nothing, and uses the exact engine that drew the
	 * preview. The server render stays the path for the API and for bulk runs,
	 * and is the fallback here when the browser can't encode.
	 */
	async function exportVideo() {
		if (isExporting || !editor) return;
		exportError = '';
		renderUrl = '';
		exportProgress = 0;

		const missing = missingRequired(variableDefinitions, testValues);
		if (missing.length) {
			exportError = `Set a value for ${missing.map((n) => `"${n}"`).join(', ')} before rendering.`;
			activeTab = 'variables';
			return;
		}

		isExporting = true;
		exportController = new AbortController();
		try {
			const authored = documentToSave();
			const filled = applyVariables(authored, testValues, variableDefinitions);

			if (clientExportSupported) {
				exportStage = 'Rendering in your browser';
				const { exportProjectToBlob } = await import('$lib/video/exportHost.js');
				const blob = await exportProjectToBlob(filled, {
					onProgress: (value) => (exportProgress = value),
					signal: exportController.signal
				});

				exportStage = 'Uploading';
				const file = new File([blob], `${(name || 'video').replace(/[^\w.-]+/g, '-')}.mp4`, {
					type: 'video/mp4'
				});
				const response = await uploadVideoMedia(file, { purpose: 'render', templateUid: uid });
				renderUrl = response?.media?.url || '';
				if (!renderUrl) throw new Error('The render finished but the upload returned no URL.');
				analytics.track?.('Video Template Rendered', { uid, via: 'client' });
			} else {
				// No WebCodecs — the server has to do it, which needs a saved template.
				exportStage = 'Rendering on the server';
				// Defer the URL swap: navigating to /[uid]/studio remounts this
				// component, and the render would be lost mid-flight.
				const wasNew = !uid;
				const savedUid =
					uid && !isDirty ? uid : await save({ silent: true, deferNavigation: true });
				if (!savedUid) throw new Error(saveError || 'Save the template before rendering.');
				const response = await renderVideoTemplate(savedUid, { variables: testValues });
				renderUrl = response?.url || '';
				if (!renderUrl) throw new Error('The render finished but returned no URL.');
				analytics.track?.('Video Template Rendered', { uid: savedUid, via: 'server' });
				if (wasNew) pendingUrlAdoption = true;
			}
		} catch (error) {
			if (error?.name === 'AbortError') {
				exportError = '';
			} else if (error?.data?.code === 'render_bridge_not_installed') {
				exportError =
					'Server rendering is not enabled on this server, and this browser cannot encode video. Try Chrome or Edge.';
			} else {
				exportError = error?.message || 'The render failed. Please try again.';
			}
		} finally {
			isExporting = false;
			exportStage = '';
			exportController = null;
			// URL adoption waits for dismissRender(): navigating now would remount
			// the studio and take the result card with it.
		}
	}

	function cancelExport() {
		if (exportController) exportController.abort();
	}

	// ── Derived ──────────────────────────────────────────────────────────
	$: variableCount = variableDefinitions.length;
	$: canPublish = uid && variableCount >= 0;
	$: filledPreviewCount = Object.keys(resolveValues(variableDefinitions, testValues)).length;
</script>

<svelte:head>
	<title>{name || 'Video studio'} - Pictify.io</title>
</svelte:head>

<svelte:window
	on:beforeunload={(event) => {
		if (!isDirty) return;
		event.preventDefault();
		event.returnValue = '';
	}}
/>

<div class="flex h-screen w-full flex-col overflow-hidden {STAGE} text-gray-100">
	<!-- ── Top bar ───────────────────────────────────────────────────── -->
	<header
		class="relative flex h-14 shrink-0 items-center gap-3 border-b-[3px] border-black px-3 transition-colors
			{filling ? 'bg-brand-accent' : 'bg-gray-900'} {Z.dock}"
	>
		<a
			href="/dashboard/video-templates"
			class="inline-flex items-center gap-1.5 rounded-lg border-[2px] border-black px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all focus-brutal
				{filling
				? 'bg-black/10 text-black hover:bg-black/20'
				: 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-100'}"
		>
			<i class="fa fa-arrow-left text-[10px]" aria-hidden="true"></i>
			Templates
		</a>

		<input
			class="min-w-0 max-w-xs flex-1 rounded-lg border-[2px] border-transparent bg-transparent px-2 py-1 text-sm font-black transition-all focus:outline-none focus-brutal
				{filling
				? 'text-black focus:border-black focus:bg-white/40'
				: 'text-gray-100 focus:border-brand-accent focus:bg-gray-950'}"
			bind:value={name}
			on:input={markDirty}
			aria-label="Template name"
			placeholder="Untitled video"
		/>

		<div class="flex shrink-0 items-center gap-1">
			<button
				type="button"
				on:click={undo}
				disabled={!canUndo || isBooting}
				title="Undo (⌘Z)"
				aria-label="Undo"
				class="{BUTTON_ICON} {filling ? '!bg-black/10 !text-black' : ''}"
			>
				<i class="fa fa-rotate-left text-[11px]" aria-hidden="true"></i>
			</button>
			<button
				type="button"
				on:click={redo}
				disabled={!canRedo || isBooting}
				title="Redo (⌘⇧Z)"
				aria-label="Redo"
				class="{BUTTON_ICON} {filling ? '!bg-black/10 !text-black' : ''}"
			>
				<i class="fa fa-rotate-right text-[11px]" aria-hidden="true"></i>
			</button>
		</div>

		<span
			class="{filling ? CHIP_ACCENT : CHIP_NEUTRAL} {filling
				? '!bg-black !text-brand-accent'
				: ''} hidden sm:inline-flex"
		>
			{status === 'published' ? 'Published' : 'Draft'}
		</span>
		{#if variableCount > 0}
			<button
				type="button"
				on:click={() => (activeTab = 'variables')}
				class="{filling ? '!bg-black !text-brand-accent' : CHIP_NEUTRAL} {CHIP_NEUTRAL} hidden md:inline-flex focus-brutal"
				title="Show variables"
			>
				{variableCount} variable{variableCount === 1 ? '' : 's'}
			</button>
		{/if}

		<div class="flex-1"></div>

		{#if filling}
			<span class="text-[10px] font-black uppercase tracking-widest text-black">
				Preview values · {filledPreviewCount} applied
			</span>
		{:else if saveMessage}
			<span class="text-[10px] font-black uppercase tracking-widest text-data-green">
				{saveMessage}
			</span>
		{:else if isDirty}
			<span class="text-[10px] font-black uppercase tracking-widest {TEXT_FAINT}">
				Unsaved changes
			</span>
		{/if}

		<button
			type="button"
			on:click={toggleFilling}
			disabled={isBooting || (!filling && variableCount === 0)}
			title={filling
				? 'Go back to editing the template'
				: variableCount === 0
					? 'Declare a variable first'
					: 'Show your preview values on the canvas'}
			class="inline-flex items-center gap-1.5 rounded-lg border-[2px] border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all focus-brutal disabled:opacity-40 disabled:cursor-not-allowed
				{filling
				? 'bg-black text-brand-accent'
				: 'bg-gray-800 text-gray-100 hover:bg-gray-700'}"
		>
			<i class="fa {filling ? 'fa-eye-slash' : 'fa-eye'} text-[10px]" aria-hidden="true"></i>
			{filling ? 'Exit preview' : 'Preview'}
		</button>

		<button
			type="button"
			on:click={() => save()}
			disabled={isSaving || isBooting || filling}
			title={filling ? 'Exit preview to save' : 'Save this template'}
			class="{BUTTON_SECONDARY} !px-3 !py-1.5 !text-[10px]"
		>
			{isSaving ? 'Saving…' : isDirty || !uid ? 'Save' : 'Saved'}
		</button>

		<button
			type="button"
			on:click={exportVideo}
			disabled={isExporting || isBooting}
			class="{BUTTON_PRIMARY} !px-4 !py-1.5 !text-[10px]"
		>
			{#if isExporting}
				<i class="fa fa-spinner fa-spin text-[10px]" aria-hidden="true"></i>
				{Math.round(exportProgress * 100)}%
			{:else}
				<i class="fa fa-film text-[10px]" aria-hidden="true"></i>
				Render MP4
			{/if}
		</button>
	</header>

	<!-- ── Notices ───────────────────────────────────────────────────── -->
	{#if mountError}
		<div
			class="shrink-0 border-b-[3px] border-brand-danger bg-brand-danger/15 px-4 py-2 font-mono text-[11px] font-bold text-brand-danger"
			role="alert"
		>
			{mountError}
		</div>
	{/if}
	{#if saveError}
		<div
			class="flex shrink-0 items-center gap-3 border-b-[3px] border-brand-danger bg-brand-danger/15 px-4 py-2 text-[11px] font-bold text-brand-danger"
			role="alert"
		>
			<span class="flex-1">{saveError}</span>
			<button type="button" on:click={() => save()} class={BUTTON_COMPACT}>Try again</button>
			<button
				type="button"
				on:click={() => (saveError = '')}
				class={BUTTON_ICON}
				aria-label="Dismiss"
			>
				<i class="fa fa-xmark text-[10px]" aria-hidden="true"></i>
			</button>
		</div>
	{/if}
	{#if mediaWarning}
		<div
			class="flex shrink-0 items-center gap-3 border-b-[3px] border-black bg-brand-accent/20 px-4 py-2 text-[11px] font-bold text-brand-accent"
			role="status"
		>
			<i class="fa fa-triangle-exclamation" aria-hidden="true"></i>
			<span class="flex-1">{mediaWarning}</span>
			<button
				type="button"
				on:click={() => (mediaWarning = '')}
				class={BUTTON_ICON}
				aria-label="Dismiss"
			>
				<i class="fa fa-xmark text-[10px]" aria-hidden="true"></i>
			</button>
		</div>
	{/if}

	<!-- ── Studio: rail | stage | panel ──────────────────────────────── -->
	<div class="flex min-h-0 flex-1">
		<div bind:this={railEl} class="h-full shrink-0 border-r-[3px] border-black"></div>

		<div bind:this={canvasWrapEl} class="relative min-w-0 flex-1 overflow-hidden {STAGE} {Z.canvas}">
			{#if isBooting}
				<div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
					<div
						class="h-10 w-10 animate-pulse rounded-xl border-[3px] border-black bg-brand-accent shadow-brutal-sm"
					></div>
					<p class="text-[10px] font-black uppercase tracking-widest {TEXT_MUTED}">
						Starting the studio
					</p>
				</div>
			{/if}
			<canvas bind:this={canvasEl} class="block h-full w-full"></canvas>

			<!-- Render result / progress, floating over the stage -->
			{#if isExporting || renderUrl || exportError}
				<div class="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 {Z.inspector}">
					<div class="pointer-events-auto w-full max-w-md {CARD} p-4">
						{#if isExporting}
							<div class="flex items-center justify-between gap-3">
								<p class={HEADING}>{exportStage}</p>
								<button type="button" on:click={cancelExport} class={BUTTON_COMPACT}>
									Cancel
								</button>
							</div>
							<div
								class="mt-3 h-2 overflow-hidden rounded-full border-[2px] border-black bg-gray-950"
							>
								<div
									class="h-full bg-brand-accent transition-[width] duration-200"
									style={`width: ${Math.round(exportProgress * 100)}%`}
								></div>
							</div>
							<p class="mt-2 text-[10px] font-bold {TEXT_MUTED}">
								{clientExportSupported
									? 'Rendering on your machine — keep this tab open.'
									: 'Rendering on the server. This can take a few minutes.'}
							</p>
						{:else if exportError}
							<div class="flex items-start gap-3">
								<i class="fa fa-circle-exclamation mt-0.5 text-brand-danger" aria-hidden="true"></i>
								<div class="min-w-0 flex-1">
									<p class="text-xs font-black uppercase tracking-widest text-brand-danger">
										Render failed
									</p>
									<p class="mt-1 text-[11px] font-bold {TEXT_MUTED}">{exportError}</p>
								</div>
							</div>
							<div class="mt-3 flex items-center gap-2">
								<button type="button" on:click={exportVideo} class={BUTTON_COMPACT}>
									Try again
								</button>
								<button
									type="button"
									on:click={() => (exportError = '')}
									class={BUTTON_COMPACT}
								>
									Dismiss
								</button>
							</div>
						{:else}
							<div class="flex items-center justify-between gap-3">
								<p class="text-xs font-black uppercase tracking-widest text-data-green">
									Your video is ready
								</p>
								<button
									type="button"
									on:click={dismissRender}
									class={BUTTON_ICON}
									aria-label="Dismiss"
								>
									<i class="fa fa-xmark text-[10px]" aria-hidden="true"></i>
								</button>
							</div>
							<!-- svelte-ignore a11y-media-has-caption -->
							<video
								controls
								src={renderUrl}
								class="mt-3 max-h-56 w-full rounded-xl border-[3px] border-black bg-black"
							></video>
							<div class="mt-3 flex flex-wrap items-center gap-2">
								<a
									href={renderUrl}
									download
									class="{BUTTON_COMPACT} !bg-brand-accent !text-black"
								>
									<i class="fa fa-download text-[10px]" aria-hidden="true"></i>
									Download
								</a>
								<button
									type="button"
									on:click={() => navigator.clipboard?.writeText(renderUrl)}
									class={BUTTON_COMPACT}
								>
									<i class="fa fa-link text-[10px]" aria-hidden="true"></i>
									Copy URL
								</button>
								{#if uid}
									<a href="/dashboard/video-templates/{uid}/render" class={BUTTON_COMPACT}>
										Render with other values
									</a>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right panel: clip properties + variables -->
		<aside
			class="flex h-full w-80 shrink-0 flex-col border-l-[3px] border-black {PANEL} {Z.dock}"
			aria-label="Inspector"
		>
			<div class="flex shrink-0 border-b-[3px] border-black" role="tablist">
				<button
					role="tab"
					aria-selected={activeTab === 'properties'}
					on:click={() => (activeTab = 'properties')}
					class="flex-1 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors focus-brutal
						{activeTab === 'properties'
						? 'bg-gray-800 text-brand-accent'
						: 'text-gray-400 hover:text-gray-100'}"
				>
					Properties
				</button>
				<button
					role="tab"
					aria-selected={activeTab === 'variables'}
					on:click={() => (activeTab = 'variables')}
					class="flex-1 border-l-[3px] border-black px-3 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors focus-brutal
						{activeTab === 'variables'
						? 'bg-gray-800 text-brand-accent'
						: 'text-gray-400 hover:text-gray-100'}"
				>
					Variables
					{#if variableCount}
						<span
							class="ml-1 rounded-full border-[1.5px] border-black bg-brand-accent px-1.5 text-[9px] text-black"
						>
							{variableCount}
						</span>
					{/if}
				</button>
			</div>

			<!-- The vendored clip-properties island stays mounted; hiding it with
			     CSS avoids tearing down and rebuilding a React root on every tab
			     switch (which would drop its internal ephemeral drag state). -->
			<div
				class="ov-scroll min-h-0 flex-1 overflow-y-auto"
				class:hidden={activeTab !== 'properties'}
			>
				<div bind:this={propsEl}></div>
				<ClipBindingsPanel
					clip={selectedClip}
					{variableDefinitions}
					on:bind={onBind}
					on:createAndBind={onCreateAndBind}
				/>
			</div>

			<div class="min-h-0 flex-1" class:hidden={activeTab !== 'variables'}>
				<VideoVariablesPanel
					bind:variableDefinitions
					bind:testValues
					{autoAdded}
					{usage}
					{filling}
					on:change={onVariablesChange}
					on:ackAutoAdded={onAckAutoAdded}
					on:rename={onVariableRename}
					on:requestRemove={onRequestRemove}
					on:startFilling={startFilling}
				/>
			</div>
		</aside>
	</div>

	<!-- ── Timeline dock ─────────────────────────────────────────────── -->
	<footer class="shrink-0 {STAGE} {Z.dock}">
		<div
			class="h-1.5 cursor-row-resize touch-none bg-gray-900 transition-colors hover:bg-brand-accent"
			role="separator"
			aria-orientation="horizontal"
			aria-label="Resize timeline"
			on:pointerdown={startTimelineResize}
			on:pointermove={moveTimelineResize}
			on:pointerup={endTimelineResize}
			on:pointercancel={endTimelineResize}
		></div>
		<div
			bind:this={timelineEl}
			class="w-full border-t-[3px] border-black"
			style={`height: ${timelineHeight}px`}
		>
			{#if isBooting}
				<div
					class="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-widest {TEXT_FAINT}"
				>
					Loading the timeline
				</div>
			{/if}
		</div>
	</footer>
</div>

<style>
	/* The vendored studio panels render into plain divs from React, so their
	   primitive styling has to be global. Accent is #ffc480 (brand-accent),
	   not the upstream yellow. */
	:global(.ov-slider) {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		border-radius: 9999px;
		background: #27272a;
		outline: none;
		cursor: pointer;
	}
	:global(.ov-slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 9999px;
		background: #ffc480;
		border: none;
		cursor: pointer;
	}
	:global(.ov-slider::-moz-range-thumb) {
		width: 12px;
		height: 12px;
		border-radius: 9999px;
		background: #ffc480;
		border: none;
		cursor: pointer;
	}
	:global(.ov-scroll) {
		scrollbar-width: thin;
		scrollbar-color: #3f3f46 transparent;
	}
	:global(.ov-scroll::-webkit-scrollbar) {
		width: 6px;
	}
	:global(.ov-scroll::-webkit-scrollbar-thumb) {
		background: #3f3f46;
		border-radius: 9999px;
	}
</style>
