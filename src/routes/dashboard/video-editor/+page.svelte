<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/analytics.js';
	import {
		createVideoProject,
		updateVideoProject,
		getVideoProject,
		renderVideoProject
	} from '../../../api/videoProjects';
	import { uploadBrandAsset } from '../../../api/brand-assets';

	// ── Editor state ─────────────────────────────────────────────────────
	let canvasEl;
	let canvasWrapEl;
	let timelineEl;
	let railEl;
	let propsEl;
	let editor = null; // handle from mountVideoEditor
	let timelinePanel = null; // handle from mountTimelinePanel
	let toolRail = null; // handle from mountToolRail
	let propertiesPanel = null; // handle from mountPropertiesPanel
	let mountError = '';
	let isBooting = true;

	let projectUid = null;
	let projectName = 'Untitled video';
	let isDirty = false;

	// Edit tracking (references change only when the document changes)
	let trackDirty = false;
	let lastClips = null;
	let lastTracks = null;

	let isSaving = false;
	let saveMessage = '';
	let isRendering = false;
	let renderMessage = '';
	let renderUrl = '';

	// Resizable timeline dock
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

	// ── Canvas re-fit ────────────────────────────────────────────────────
	// The Pixi renderer keeps its mount-time pixel size; observe the canvas
	// container and re-fit whenever panels or the timeline dock change it.
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

	// ── Media upload (tool rail callback) ────────────────────────────────
	// Images go through Pictify's existing brand-assets upload (S3-backed,
	// persistent URL). Video/audio have no upload endpoint yet.
	// TODO(backend): add a video/audio media upload endpoint; until then those
	// files become session-local object URLs (they will not survive a reload
	// or a server-side render).
	const uploadMedia = async (file) => {
		if (file.type.startsWith('image/')) {
			try {
				const response = await uploadBrandAsset(file, { type: 'image', name: file.name });
				const url = response?.asset?.url;
				if (url) return { url, persistent: true };
			} catch (error) {
				// Fall through to a session-local object URL (plan limits, size…).
			}
		}
		return { url: URL.createObjectURL(file), persistent: false };
	};

	// ── Mount ────────────────────────────────────────────────────────────
	onMount(async () => {
		analytics.page('Video Editor');
		projectUid = $page.url.searchParams.get('uid');

		let projectJson = null;
		if (projectUid) {
			try {
				const response = await getVideoProject(projectUid);
				projectJson = response?.project?.projectJson || null;
				projectName = response?.project?.name || projectName;
			} catch (error) {
				mountError = error?.message || 'Failed to load the project.';
				isBooting = false;
				return;
			}
		}

		try {
			// Browser-only engines — never import at module top level (SSR).
			const { mountVideoEditor } = await import('$lib/video/editorHost.js');
			editor = await mountVideoEditor(canvasEl, {
				project: projectJson,
				onState: (state) => {
					// Any change to the clip/track graph after boot marks the
					// project dirty (drag, trim, split, reorder, undo, redo,
					// panel edits, property edits, …).
					if (trackDirty && (state.clips !== lastClips || state.tracks !== lastTracks)) {
						markDirty();
					}
					lastClips = state.clips;
					lastTracks = state.tracks;
				},
				onError: (message) => {
					mountError = message;
				}
			});
			trackDirty = true;

			// Dev-only hook for QA tooling (headless browser assertions).
			if (import.meta.env.DEV) window.__videoEditor = editor;

			// The vendored OpenVideo timeline panel — a React island bound to
			// the SAME core/studio pair the canvas uses.
			const { mountTimelinePanel } = await import('$lib/video/timelineHost.js');
			timelinePanel = mountTimelinePanel(timelineEl, {
				core: editor.core,
				studio: editor.studio
			});

			// Studio side panels — left tool rail + right properties panel,
			// bound to the same core/studio (shared selection store).
			const { mountToolRail, mountPropertiesPanel } = await import('$lib/video/studioHost.js');
			toolRail = mountToolRail(railEl, {
				core: editor.core,
				studio: editor.studio,
				uploadMedia
			});
			propertiesPanel = mountPropertiesPanel(propsEl, {
				core: editor.core,
				studio: editor.studio
			});

			observeCanvasResize();
		} catch (error) {
			mountError = error?.message || 'The video editor failed to start.';
		} finally {
			isBooting = false;
		}
	});

	onDestroy(() => {
		if (resizeObserver) resizeObserver.disconnect();
		cancelAnimationFrame(resizeRaf);
		if (toolRail) toolRail.destroy();
		if (propertiesPanel) propertiesPanel.destroy();
		if (timelinePanel) timelinePanel.destroy();
		if (editor) editor.destroy();
	});

	const markDirty = () => {
		isDirty = true;
		saveMessage = '';
	};

	// ── Persistence ──────────────────────────────────────────────────────
	const save = async () => {
		if (!editor || isSaving) return;
		isSaving = true;
		saveMessage = '';
		try {
			const projectJson = editor.exportProject();
			if (projectUid) {
				await updateVideoProject(projectUid, { name: projectName, projectJson });
			} else {
				const response = await createVideoProject({ name: projectName, projectJson });
				projectUid = response?.project?.uid || null;
				if (projectUid) {
					goto(`/dashboard/video-editor?uid=${projectUid}`, {
						replaceState: true,
						keepFocus: true,
						noScroll: true
					});
				}
			}
			isDirty = false;
			saveMessage = 'Saved';
			analytics.track?.('Video Project Saved', { uid: projectUid });
		} catch (error) {
			saveMessage = error?.message || 'Save failed.';
		} finally {
			isSaving = false;
		}
	};

	const render = async () => {
		if (isRendering) return;
		renderMessage = '';
		renderUrl = '';
		if (isDirty || !projectUid) await save();
		if (!projectUid) return;
		isRendering = true;
		try {
			const response = await renderVideoProject(projectUid);
			renderUrl = response?.url || '';
			renderMessage = renderUrl ? 'Render complete.' : 'Render finished without a URL.';
			analytics.track?.('Video Project Rendered', { uid: projectUid });
		} catch (error) {
			renderMessage = error?.message || 'Render failed.';
		} finally {
			isRendering = false;
		}
	};
</script>

<svelte:head>
	<title>Video editor - Pictify.io</title>
</svelte:head>

<div class="h-screen w-full flex flex-col overflow-hidden bg-[#101014] text-gray-100">
	<!-- Slim top bar -->
	<header class="shrink-0 flex items-center gap-3 px-4 h-12 border-b border-gray-800 bg-[#16161c]">
		<a
			href="/dashboard"
			class="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors whitespace-nowrap"
		>
			&larr; Dashboard
		</a>
		<input
			class="flex-1 min-w-0 max-w-md bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-gray-600 px-1 py-0.5"
			bind:value={projectName}
			on:input={markDirty}
			aria-label="Project name"
		/>
		<div class="flex-1" />
		{#if saveMessage}
			<span class="text-xs text-gray-400">{saveMessage}</span>
		{:else if isDirty}
			<span class="text-xs text-gray-500">Unsaved changes</span>
		{/if}
		<button
			class="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded border border-gray-700 hover:bg-gray-800 disabled:opacity-50 transition-colors"
			on:click={save}
			disabled={isSaving || isBooting}
		>
			{isSaving ? 'Saving…' : isDirty || !projectUid ? 'Save' : 'Saved'}
		</button>
		<button
			class="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50 transition-colors"
			on:click={render}
			disabled={isRendering || isBooting}
		>
			{isRendering ? 'Rendering…' : 'Render MP4'}
		</button>
	</header>

	{#if mountError}
		<div class="px-4 py-2 text-xs font-mono text-red-400 bg-red-950/40 border-b border-red-900">
			{mountError}
		</div>
	{/if}
	{#if renderMessage}
		<div class="px-4 py-2 text-xs bg-gray-900 border-b border-gray-800 flex items-center gap-3">
			<span class:text-red-400={!renderUrl} class:text-green-400={!!renderUrl}>{renderMessage}</span
			>
			{#if renderUrl}
				<a class="underline text-yellow-400" href={renderUrl} target="_blank" rel="noreferrer">
					Open video
				</a>
			{/if}
		</div>
	{/if}

	<!-- Studio: tool rail | canvas | properties -->
	<div class="flex-1 min-h-0 flex">
		<!-- Left tool rail + panel drawer (React island, self-sized) -->
		<div bind:this={railEl} class="h-full shrink-0" />

		<!-- Canvas (overflow-hidden + ResizeObserver re-fit) -->
		<div bind:this={canvasWrapEl} class="flex-1 min-w-0 relative overflow-hidden bg-[#101014]">
			{#if isBooting}
				<div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
					Starting the editor…
				</div>
			{/if}
			<canvas bind:this={canvasEl} class="w-full h-full block" />
		</div>

		<!-- Right properties panel (React island) -->
		<div bind:this={propsEl} class="h-full w-72 shrink-0 border-l border-gray-800 bg-[#101014]" />
	</div>

	<!-- Timeline dock (vendored OpenVideo timeline, React island, full width) -->
	<footer class="shrink-0 bg-[#101014]">
		<!-- Resize handle -->
		<div
			class="h-1.5 cursor-row-resize bg-[#141419] hover:bg-yellow-400/40 transition-colors touch-none"
			role="separator"
			aria-orientation="horizontal"
			aria-label="Resize timeline"
			on:pointerdown={startTimelineResize}
			on:pointermove={moveTimelineResize}
			on:pointerup={endTimelineResize}
			on:pointercancel={endTimelineResize}
		/>
		<div bind:this={timelineEl} class="w-full" style={`height: ${timelineHeight}px`}>
			{#if isBooting}
				<div class="h-full flex items-center justify-center text-xs text-gray-600">
					Loading the timeline…
				</div>
			{/if}
		</div>
	</footer>
</div>

<style>
	/* Primitive styling for the vendored studio panels (React islands render
	   into plain divs, so these must be global). */
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
		background: #facc15;
		border: none;
		cursor: pointer;
	}
	:global(.ov-slider::-moz-range-thumb) {
		width: 12px;
		height: 12px;
		border-radius: 9999px;
		background: #facc15;
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
