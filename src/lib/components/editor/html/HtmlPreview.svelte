<script>
	/**
	 * HtmlPreview — debounced live render via POST /templates/preview.
	 *
	 * Dialect matches the dashboard: rounded-xl frame, press-in hover on
	 * Retry, font-black uppercase status pills. Image itself keeps the
	 * 4px_4px brutal shadow so it feels like a tangible artifact, not a
	 * floating iframe.
	 *
	 * 300ms debounce; AbortController + requestSeq for stale-response
	 * protection. Shows stage timings footer when totalMs > 1s.
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
				'/templates/preview',
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
			if (err && err.name === 'AbortError') return;
			if (mySeq !== requestSeq) return;
			const st = err?.status || 0;
			if (st === 404) {
				error =
					'Preview route 404 — is the backend running the engine=html branch?';
			} else if (st === 401 || st === 403) {
				error = 'Sign in to use live preview.';
			} else if (st === 429) {
				error = 'Preview rate limit — slow down typing.';
			} else {
				error = (err && err.message) || 'Preview failed';
			}
			status = 'error';
			console.error('[html-preview] error:', err);
		} finally {
			if (mySeq === requestSeq) loading = false;
		}
	}

	function scheduleRun() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(runPreview, DEBOUNCE_MS);
	}

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

<div class="flex h-full w-full flex-col gap-4 bg-[#FFFDF8] p-6">
	<!-- Image frame. The inner padding gives the rendered image some
	     breathing room against the neobrutalist border so wide
	     templates don't visually touch the frame corners. -->
	<div
		class="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border-[3px] border-gray-900 bg-[#f5f0e6] p-4 shadow-[6px_6px_0_0_#1f2937]"
		aria-live="off"
	>
		{#if dataUrl}
			<!--
			  Scale the preview to FIT the frame on both axes while
			  preserving the template's aspect ratio. Inline width/height
			  (which were clipping tall/wide templates because they
			  forced native px dimensions) are replaced with CSS
			  `aspect-ratio` + `max-w/h: 100%` so the browser picks the
			  largest axis that fits. `object-contain` is redundant here
			  but kept as a belt-and-suspenders for browsers that
			  render the img element at intrinsic size first.
			-->
			<img
				src={dataUrl}
				alt="Live template preview"
				class="block h-auto w-auto max-h-full max-w-full rounded-md border-[2px] border-gray-900 bg-white object-contain shadow-[3px_3px_0_0_#1f2937]"
				style="aspect-ratio: {width} / {height};"
			/>
		{:else if loading}
			<div class="flex flex-col items-center gap-3 text-gray-500">
				<div class="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffc480] shadow-[3px_3px_0_0_#1f2937]">
					<i class="fa fa-hourglass-half text-gray-900"></i>
				</div>
				<span class="text-[11px] font-black uppercase tracking-widest">Rendering…</span>
			</div>
		{:else if !html}
			<div class="flex max-w-xs flex-col items-center gap-3 text-center">
				<div class="flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-gray-900 bg-[#ffe066] shadow-[3px_3px_0_0_#1f2937]">
					<i class="fa fa-eye text-lg text-gray-900"></i>
				</div>
				<p class="text-[11px] font-black uppercase tracking-widest text-gray-900">
					Live preview
				</p>
				<p class="text-[12px] font-bold leading-relaxed text-gray-600">
					Every keystroke renders here. Write HTML on the left, see the image on the right.
				</p>
				<code class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-2 py-1 font-mono text-[11px] text-[#ffc480]">
					&lt;h1&gt;{'{{'}title{'}}'}&lt;/h1&gt;
				</code>
			</div>
		{/if}

		{#if loading && dataUrl}
			<div
				class="absolute left-3 top-3 flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-[#ffc480] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]"
			>
				<i class="fa fa-rotate-right fa-spin text-[9px]"></i>
				Rendering
			</div>
		{/if}
	</div>

	<!-- Status footer — pill chips matching the dashboard's filter chips -->
	<div class="flex flex-wrap items-center gap-2" role="status" aria-live="polite">
		<span
			class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]"
		>
			<i class="fa fa-expand text-[10px]"></i>
			{width} × {height}
		</span>
		<span
			class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]"
		>
			{format}
		</span>
		{#if totalMs > 0}
			<span
				class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]"
			>
				<i class="fa fa-clock text-[10px]"></i>
				{(totalMs / 1000).toFixed(2)}s
			</span>
		{/if}

		{#if totalMs > 1000 && timings}
			<span class="text-[10px] font-mono text-gray-500">
				compile {timings.compileAndApply || 0}ms · setContent {timings.setContent || 0}ms · fonts {timings.waitForFonts || 0}ms
			</span>
		{/if}

		<div class="flex-1"></div>

		{#if status === 'error'}
			<span
				class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-[#ff6b6b] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#1f2937]"
			>
				<i class="fa fa-triangle-exclamation text-[10px]"></i>
				{error}
			</span>
			<button
				type="button"
				on:click={retry}
				class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
			>
				Retry
			</button>
		{:else if status === 'ok'}
			<span
				class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-[#4ade80] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]"
			>
				<span class="relative flex h-2 w-2">
					<span class="relative inline-flex h-2 w-2 rounded-full border-[1.5px] border-gray-900 bg-[#22c55e]"></span>
				</span>
				Synced
			</span>
		{/if}
	</div>
</div>
