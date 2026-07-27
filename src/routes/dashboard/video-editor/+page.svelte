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

	// ── Editor state ─────────────────────────────────────────────────────
	const US = 1000000; // microseconds per second

	let canvasEl;
	let timelineEl;
	let editor = null; // handle from mountVideoEditor
	let timelinePanel = null; // handle from mountTimelinePanel
	let mountError = '';
	let isBooting = true;

	let projectUid = null;
	let projectName = 'Untitled video';
	let isDirty = false;

	// Edit tracking (references change only when the document changes)
	let trackDirty = false;
	let lastClips = null;
	let lastTracks = null;

	let selectedClipIds = [];

	let isSaving = false;
	let saveMessage = '';
	let isRendering = false;
	let renderMessage = '';
	let renderUrl = '';

	// Resizable timeline dock
	const TIMELINE_MIN_HEIGHT = 200;
	const TIMELINE_MAX_HEIGHT = 520;
	let timelineHeight = 300;
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
					// project dirty (drag, trim, split, reorder, undo, redo, …).
					if (trackDirty && (state.clips !== lastClips || state.tracks !== lastTracks)) {
						markDirty();
					}
					lastClips = state.clips;
					lastTracks = state.tracks;
				},
				onSelection: (selected) => {
					selectedClipIds = (selected || []).map((clip) => clip.id);
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
		} catch (error) {
			mountError = error?.message || 'The video editor failed to start.';
		} finally {
			isBooting = false;
		}
	});

	onDestroy(() => {
		if (timelinePanel) timelinePanel.destroy();
		if (editor) editor.destroy();
	});

	const markDirty = () => {
		isDirty = true;
		saveMessage = '';
	};

	// ── Toolbar actions ──────────────────────────────────────────────────
	const addText = async () => {
		if (!editor) return;
		await editor.addText('Your text here');
		markDirty();
	};

	const addImage = async () => {
		if (!editor) return;
		const src = window.prompt('Image URL');
		if (!src) return;
		await editor.addImage(src);
		markDirty();
	};

	const addVideo = async () => {
		if (!editor) return;
		const src = window.prompt('Video URL (mp4)');
		if (!src) return;
		await editor.addVideo(src);
		markDirty();
	};

	const deleteSelected = () => {
		if (!editor || !selectedClipIds.length) return;
		editor.removeClips(selectedClipIds);
		selectedClipIds = [];
		markDirty();
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

<section
	class="h-[calc(100vh-7rem)] min-h-[520px] flex flex-col rounded-xl overflow-hidden border border-gray-800 bg-[#101014] text-gray-100"
>
	<!-- Header -->
	<header class="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 bg-[#16161c]">
		<a
			href="/dashboard"
			class="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
		>
			&larr; Dashboard
		</a>
		<input
			class="flex-1 min-w-0 bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-gray-600 px-1 py-0.5"
			bind:value={projectName}
			on:input={markDirty}
			aria-label="Project name"
		/>
		{#if saveMessage}
			<span class="text-xs text-gray-400">{saveMessage}</span>
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

	<!-- Main: toolbar + canvas -->
	<div class="flex-1 min-h-0 flex">
		<!-- Left toolbar -->
		<aside class="w-40 shrink-0 border-r border-gray-800 bg-[#141419] p-3 flex flex-col gap-2">
			<span class="text-[10px] font-black uppercase tracking-widest text-gray-500">Add</span>
			<button class="editor-tool" on:click={addText} disabled={isBooting}>+ Text</button>
			<button class="editor-tool" on:click={addImage} disabled={isBooting}>+ Image</button>
			<button class="editor-tool" on:click={addVideo} disabled={isBooting}>+ Video</button>
			<span class="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-3">Edit</span>
			<button class="editor-tool" on:click={() => editor?.undo()} disabled={isBooting}>Undo</button>
			<button class="editor-tool" on:click={() => editor?.redo()} disabled={isBooting}>Redo</button>
			<button
				class="editor-tool text-red-400 disabled:text-gray-600"
				on:click={deleteSelected}
				disabled={!selectedClipIds.length}
			>
				Delete clip
			</button>
		</aside>

		<!-- Canvas (overflow-hidden: the Pixi canvas keeps its mount-time pixel
		     size, so clip it when the timeline dock is resized taller) -->
		<div class="flex-1 min-w-0 relative overflow-hidden bg-[#101014]">
			{#if isBooting}
				<div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
					Starting the editor…
				</div>
			{/if}
			<canvas bind:this={canvasEl} class="w-full h-full block" />
		</div>
	</div>

	<!-- Timeline dock (vendored OpenVideo timeline, React island) -->
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
</section>

<style>
	.editor-tool {
		text-align: left;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.375rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid rgb(55 65 81);
		transition: background-color 120ms ease;
	}
	.editor-tool:hover:not(:disabled) {
		background-color: rgb(31 41 55);
	}
	.editor-tool:disabled {
		opacity: 0.5;
	}
</style>
