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
	const PIXELS_PER_SECOND = 40;

	let canvasEl;
	let editor = null; // handle from mountVideoEditor
	let mountError = '';
	let isBooting = true;

	let projectUid = null;
	let projectName = 'Untitled video';
	let isDirty = false;

	// Engine store mirror (updated via onState)
	let currentTime = 0;
	let isPlaying = false;
	let tracks = [];
	let clips = {};
	let settings = { width: 1080, height: 1920, fps: 30, duration: 30 * US };

	let selectedClipIds = [];

	let isSaving = false;
	let saveMessage = '';
	let isRendering = false;
	let renderMessage = '';
	let renderUrl = '';

	$: durationUs = Math.max(
		settings?.duration || 0,
		...Object.values(clips || {}).map((clip) => clip?.timing?.display?.to || 0),
		1
	);

	const formatTime = (us) => {
		const totalSeconds = Math.max(0, us) / US;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds - minutes * 60;
		return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
	};

	const trackClips = (track) =>
		(track?.clipIds || []).map((id) => clips[id]).filter((clip) => clip && clip.timing?.display);

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
			// Browser-only engine — never import at module top level (SSR).
			const { mountVideoEditor } = await import('$lib/video/editorHost.js');
			editor = await mountVideoEditor(canvasEl, {
				project: projectJson,
				onState: (state) => {
					currentTime = state.currentTime || 0;
					isPlaying = !!state.isPlaying;
					tracks = state.tracks || [];
					clips = state.clips || {};
					settings = state.settings || settings;
				},
				onSelection: (selected) => {
					selectedClipIds = (selected || []).map((clip) => clip.id);
				},
				onError: (message) => {
					mountError = message;
				}
			});
		} catch (error) {
			mountError = error?.message || 'The video editor failed to start.';
		} finally {
			isBooting = false;
		}
	});

	onDestroy(() => {
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

	const togglePlayback = () => {
		if (editor) editor.toggle();
	};

	const seekTo = (us) => {
		if (editor) editor.seek(Math.min(Math.max(0, us), durationUs));
	};

	const handleRulerClick = (event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const seconds = (event.clientX - rect.left) / PIXELS_PER_SECOND;
		seekTo(seconds * US);
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

		<!-- Canvas -->
		<div class="flex-1 min-w-0 relative bg-[#101014]">
			{#if isBooting}
				<div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
					Starting the editor…
				</div>
			{/if}
			<canvas bind:this={canvasEl} class="w-full h-full block" />
		</div>
	</div>

	<!-- Transport + timeline -->
	<footer class="shrink-0 border-t border-gray-800 bg-[#141419]">
		<div class="flex items-center gap-3 px-4 py-2 border-b border-gray-800">
			<button
				class="w-8 h-8 rounded-full bg-white text-black font-black text-xs flex items-center justify-center hover:bg-gray-200 transition-colors"
				on:click={togglePlayback}
				aria-label={isPlaying ? 'Pause' : 'Play'}
			>
				{isPlaying ? '❚❚' : '▶'}
			</button>
			<span class="text-xs font-mono text-gray-400 tabular-nums">
				{formatTime(currentTime)} / {formatTime(durationUs)}
			</span>
			<span class="text-[10px] text-gray-600 ml-auto">
				{settings.width}×{settings.height} · {settings.fps} fps
			</span>
		</div>

		<!-- Minimal timeline strip (placeholder for the full canvas timeline) -->
		<div class="h-36 overflow-auto">
			<div
				class="relative min-w-full"
				style={`width: ${Math.ceil((durationUs / US) * PIXELS_PER_SECOND) + 80}px`}
			>
				<!-- Ruler -->
				<button
					type="button"
					class="block w-full h-5 relative border-b border-gray-800 bg-[#101014] cursor-pointer text-left"
					on:click={handleRulerClick}
					aria-label="Seek"
				>
					{#each Array.from({ length: Math.ceil(durationUs / US) + 1 }, (v, i) => i) as second}
						<span
							class="absolute top-0 h-full border-l border-gray-800 text-[9px] text-gray-600 pl-1 select-none"
							style={`left: ${second * PIXELS_PER_SECOND}px`}
						>
							{second}s
						</span>
					{/each}
				</button>

				<!-- Tracks -->
				{#each tracks as track (track.id)}
					<div class="relative h-9 border-b border-gray-800/60">
						<span
							class="sticky left-0 z-10 inline-block text-[9px] font-black uppercase tracking-widest text-gray-600 px-1"
						>
							{track.name || track.type}
						</span>
						{#each trackClips(track) as clip (clip.id)}
							<div
								class={`absolute top-1 bottom-1 rounded border text-[10px] px-1.5 flex items-center overflow-hidden whitespace-nowrap select-none ${
									selectedClipIds.includes(clip.id)
										? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
										: 'border-gray-700 bg-gray-800 text-gray-300'
								}`}
								style={`left: ${
									(clip.timing.display.from / US) * PIXELS_PER_SECOND
								}px; width: ${Math.max(
									8,
									((clip.timing.display.to - clip.timing.display.from) / US) * PIXELS_PER_SECOND
								)}px`}
								title={clip.name || clip.type}
							>
								{clip.name || clip.text || clip.type}
							</div>
						{/each}
					</div>
				{:else}
					<div class="px-4 py-6 text-xs text-gray-600">
						The timeline is empty — add text, an image, or a video to get started.
					</div>
				{/each}

				<!-- Playhead -->
				<div
					class="absolute top-0 bottom-0 w-px bg-yellow-400 pointer-events-none"
					style={`left: ${(currentTime / US) * PIXELS_PER_SECOND}px`}
				/>
			</div>
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
