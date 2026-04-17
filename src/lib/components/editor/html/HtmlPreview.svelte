<script>
	/**
	 * HtmlPreview — debounced live render via POST /template/preview.
	 *
	 * 300ms debounce per design spec. AbortController on unmount + on
	 * every new request so stale responses can't overwrite fresh ones.
	 * Shows stage-timing footer when totalMs exceeds 1s.
	 *
	 * Accessibility: `aria-live="off"` on the image wrapper because it
	 * updates every keystroke-cycle; the separate status region uses
	 * `aria-live="polite"` for explicit announcements.
	 */
	import { onDestroy } from 'svelte';
	import backend from '../../../../service/backend';

	export let html = '';
	export let variableDefinitions = [];
	export let variables = {};
	export let jsEnabled = false;
	export let strictVariables = false;
	export let width = 1080;
	export let height = 1080;
	export let format = 'png';

	let dataUrl = null;
	let loading = false;
	let error = null;
	let totalMs = 0;
	let timings = null;
	let status = 'idle'; // 'idle' | 'loading' | 'ok' | 'error'

	let debounceTimer = null;
	let inflight = null;
	let requestSeq = 0;

	const DEBOUNCE_MS = 300;

	async function runPreview() {
		const mySeq = ++requestSeq;
		if (inflight) inflight.abort();
		const controller = new AbortController();
		inflight = controller;
		loading = true;
		status = 'loading';
		error = null;

		try {
			const res = await backend.post(
				'/template/preview',
				{
					html,
					variableDefinitions,
					variables,
					jsEnabled,
					strictVariables,
					width,
					height,
					format
				},
				{ signal: controller.signal }
			);
			// `backend.post` returns the parsed JSON; ignore if a newer
			// request has since fired (stale response protection).
			if (mySeq !== requestSeq) return;
			if (res && res.dataUrl) {
				dataUrl = res.dataUrl;
				totalMs = res.totalMs || 0;
				timings = res.timings || null;
				status = 'ok';
			} else if (res && res.error) {
				error = res.error;
				status = 'error';
			}
		} catch (err) {
			if (err && err.name === 'AbortError') return; // expected
			if (mySeq !== requestSeq) return;
			error = err && err.message ? err.message : 'Preview failed';
			status = 'error';
		} finally {
			if (mySeq === requestSeq) loading = false;
		}
	}

	function scheduleRun() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(runPreview, DEBOUNCE_MS);
	}

	// Re-run preview when any meaningful input changes.
	$: if (html || variables || jsEnabled || strictVariables || width || height || format) {
		scheduleRun();
	}

	onDestroy(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
		if (inflight) inflight.abort();
	});

	function retry() {
		scheduleRun();
	}
</script>

<div class="flex h-full w-full flex-col gap-4 p-6">
	<!-- Image container — kept aspect-locked so the preview never jumps -->
	<div
		class="relative flex flex-1 items-center justify-center overflow-auto border-3 border-gray-800 bg-white shadow-brutal-md"
		aria-live="off"
	>
		{#if dataUrl}
			<img
				src={dataUrl}
				alt="Live template preview"
				class="max-h-full max-w-full object-contain"
				style="width: {width}px; height: {height}px;"
			/>
		{:else if loading}
			<div class="font-mono text-sm text-gray-500">· Rendering…</div>
		{:else if !html}
			<div class="text-center text-sm text-gray-400">
				<p class="font-mono">&lt;h1&gt;{'{{'}title{'}}'}&lt;/h1&gt;</p>
				<p class="mt-2">Start typing to see a preview.</p>
			</div>
		{:else}
			<div class="font-mono text-sm text-gray-500">Preview pending…</div>
		{/if}

		{#if loading && dataUrl}
			<!-- Subtle "refreshing" tick while a debounce is pending -->
			<div
				class="absolute left-3 top-3 border-2 border-gray-800 bg-brand-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
			>
				Rendering…
			</div>
		{/if}
	</div>

	<!-- Status footer -->
	<div
		class="flex items-center justify-between font-mono text-xs text-gray-700"
		role="status"
		aria-live="polite"
	>
		<div class="flex items-center gap-3">
			<span>{width} × {height}</span>
			<span>·</span>
			<span>{format}</span>
			{#if totalMs > 0}
				<span>·</span>
				<span>{(totalMs / 1000).toFixed(2)}s</span>
			{/if}
			{#if totalMs > 1000 && timings}
				<span>·</span>
				<span class="text-gray-500">
					compile {timings.compileAndApply || 0}ms · setContent {timings.setContent || 0}ms · fonts {timings.waitForFonts || 0}ms
				</span>
			{/if}
		</div>

		{#if status === 'error'}
			<div class="flex items-center gap-3">
				<span class="font-semibold text-brand-danger">{error}</span>
				<button
					type="button"
					class="border-2 border-gray-800 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-brutal-sm hover:shadow-brutal-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
					on:click={retry}
				>
					Retry
				</button>
			</div>
		{:else if status === 'ok'}
			<span class="text-brand-success">● Synced</span>
		{/if}
	</div>
</div>
