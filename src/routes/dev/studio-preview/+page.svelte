<script>
	/**
	 * DEV-ONLY visual harness for the studio panels.
	 *
	 * The studio is a Svelte shell hosting three React islands against a live
	 * @openvideo core. That combination cannot be exercised by svelte-check, a
	 * build, or a headless pixel render — the only way to know a panel actually
	 * appears is to look at it. The real studio sits behind an auth guard and a
	 * running backend, so this route mounts the same islands against a scratch
	 * core with no auth and no network.
	 *
	 * Returns 404 in production.
	 *
	 * ?full=1 mounts the REAL VideoStudio (top bar, timeline, panels) against a
	 * blank draft template, so studio chrome can be inspected too. The default
	 * view mounts just the islands, which boots faster for panel work.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import VideoStudio from '$lib/components/video/VideoStudio.svelte';

	$: full = $page.url.searchParams.get('full') === '1';

	const draft = {
		uid: null,
		name: 'Harness draft',
		kind: 'timeline',
		projectJson: null,
		variableDefinitions: [],
		width: 1080,
		height: 1920,
		fps: 30,
		status: 'draft'
	};

	let canvasEl;
	let railEl;
	let propsEl;
	let editor = null;
	let rail = null;
	let props = null;
	let error = '';
	let ready = false;
	let runtime = null;

	// What the stub library serves. A brand item (not deletable from the studio)
	// and two library items, so both branches of the remove control are visible.
	// Data URLs, not real files: the harness has no backend and a broken <img>
	// would look like a hydration failure.
	const swatch = (hex) =>
		`data:image/svg+xml;utf8,${encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="${hex}"/></svg>`
		)}`;
	const stubMedia = [
		{ uid: 'brand_1', kind: 'image', name: 'logo.svg', url: swatch('#ffc480'), bytes: 4096, source: 'brand' },
		{ uid: 'lib_1', kind: 'image', name: 'hero-shot.png', url: swatch('#3b82f6'), bytes: 284_000, source: 'library' },
		{ uid: 'lib_2', kind: 'video', name: 'b-roll.mp4', url: '', bytes: 18_400_000, source: 'library' },
		{ uid: 'lib_3', kind: 'audio', name: 'bed-loop.mp3', url: '', bytes: 3_200_000, source: 'library' }
	];
	let deletedMedia = [];
	// Both panels call the hydration hook; the count proves they share one request.
	let loadMediaCalls = 0;

	onMount(async () => {
		if (!dev || full) return;
		try {
			const { mountVideoEditor } = await import('$lib/video/editorHost.js');
			editor = await mountVideoEditor(canvasEl, {
				width: 1080,
				height: 1920,
				fps: 30,
				onError: (m) => (error = m)
			});
			const { mountToolRail, mountPropertiesPanel } = await import('$lib/video/studioHost.js');
			// Stub library. `?media=slow` delays the response so the loading
			// skeletons can be looked at; `?media=fail` exercises the error path.
			// Without either, hydration resolves immediately like a warm cache.
			const mediaMode = $page.url.searchParams.get('media') || '';
			rail = mountToolRail(railEl, {
				core: editor.core,
				studio: editor.studio,
				uploadMedia: async (file) => ({ url: URL.createObjectURL(file), persistent: false }),
				loadMedia: async () => {
					loadMediaCalls += 1;
					if (mediaMode === 'slow') await new Promise((r) => setTimeout(r, 2500));
					if (mediaMode === 'fail') throw new Error('Your media library could not be loaded.');
					return stubMedia;
				},
				deleteMedia: async (mediaUid) => {
					if (mediaMode === 'deletefail') throw new Error('Delete failed — try again.');
					deletedMedia = [...deletedMedia, mediaUid];
				}
			});
			props = mountPropertiesPanel(propsEl, { core: editor.core, studio: editor.studio });

			runtime = await import('$lib/video/vendor/openvideo-studio/runtime');

			// Seed one clip of each kind that owns a colour control, so every
			// gradient surface can be inspected without a timeline.
			// core.clip.add() does not return the created clip, so read the ids
			// back off the store once both are in.
			editor.core.clip.add({
				type: 'Shape',
				shapeType: 'rectangle',
				src: 'shape://rectangle',
				name: 'Rectangle',
				timing: { display: { from: 0, to: 5_000_000 }, trim: { from: 0, to: 5_000_000 }, duration: 5_000_000, playbackRate: 1 },
				transform: { x: 300, y: 800, width: 480, height: 300, angle: 0, opacity: 1, zIndex: 1 },
				style: { fill: '#3b82f6', fillOpacity: 1, stroke: { color: '#000000', width: 0 }, borderRadius: 0 }
			});

			editor.core.clip.add({
				type: 'Backdrop',
				backdropType: 'gradient',
				src: 'backdrop://gradient',
				name: 'Gradient',
				timing: { display: { from: 0, to: 5_000_000 }, trim: { from: 0, to: 5_000_000 }, duration: 5_000_000, playbackRate: 1 },
				transform: { x: 0, y: 0, width: 1080, height: 1920, angle: 0, opacity: 1, zIndex: 0 },
				style: { backdropType: 'gradient', gradientType: 'linear:135', colors: ['#FF512F', '#F09819'] }
			});


			// Dev harness: expose the pieces so a browser session can poke at them.
			window.__studio = { editor, runtime, deletedMedia: () => deletedMedia, loadMediaCalls: () => loadMediaCalls };
			ready = true;
		} catch (e) {
			error = e?.message || String(e);
		}
	});

	function selectByType(type) {
		const clips = editor?.core.store.getState().clips || {};
		const clip = Object.values(clips).find((c) => c.type === type);
		if (clip && runtime) runtime.useStudioStore.getState().setSelectedClips([clip]);
	}

	onDestroy(() => {
		rail?.destroy();
		props?.destroy();
		editor?.destroy();
	});
</script>

{#if !dev}
	<p>Not available.</p>
{:else if full}
	<VideoStudio template={draft} />
{:else}
	<div class="flex h-screen w-full flex-col bg-gray-950 text-gray-100">
		<header class="flex h-10 shrink-0 items-center gap-3 border-b-[3px] border-black bg-gray-900 px-3">
			<span class="text-[10px] font-black uppercase tracking-widest text-brand-accent">
				Dev harness · studio panels
			</span>
			<span class="text-[10px] font-bold text-gray-500">{ready ? 'ready' : 'booting'}</span>
			<!-- Selection normally comes from the canvas or timeline; neither is
			     usable here, so drive the shared studio store directly. -->
			<button
				data-testid="select-shape"
				class="rounded border-[2px] border-black bg-gray-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-100"
				on:click={() => selectByType('Shape')}
			>
				Select shape
			</button>
			<button
				data-testid="select-gradient"
				class="rounded border-[2px] border-black bg-gray-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-100"
				on:click={() => selectByType('Backdrop')}
			>
				Select gradient
			</button>
			{#if error}<span class="text-[10px] font-bold text-brand-danger">{error}</span>{/if}
		</header>
		<div class="flex min-h-0 flex-1">
			<div bind:this={railEl} class="h-full shrink-0 border-r-[3px] border-black" data-testid="rail"></div>
			<div class="min-w-0 flex-1 bg-gray-950">
				<canvas bind:this={canvasEl} class="block h-full w-full"></canvas>
			</div>
			<aside
				bind:this={propsEl}
				class="ov-scroll h-full w-80 shrink-0 overflow-y-auto border-l-[3px] border-black bg-gray-900"
				data-testid="properties"
			></aside>
		</div>
	</div>
{/if}
