<script>
	/**
	 * HtmlSettingsPanel — template-level toggles and metadata.
	 *
	 * Dialect matches the dashboard (rounded-xl cards, #ffc480 header
	 * strip, press-in hover, font-black uppercase labels). jsEnabled
	 * warning rendered as a full rounded-xl danger card — matches the
	 * loud-brutalist "limit reached" treatment in Template.svelte.
	 */
	import { createEventDispatcher } from 'svelte';

	export let jsEnabled = false;
	export let strictVariables = false;
	export let width = 1080;
	export let height = 1080;
	export let format = 'png';
	export let pdfPreset = 'A4';

	const dispatch = createEventDispatcher();

	const MAX_DIM = 4096;
	const FORMATS = [
		{ key: 'png', label: 'PNG', icon: 'fa-image' },
		{ key: 'jpeg', label: 'JPEG', icon: 'fa-image' },
		{ key: 'pdf', label: 'PDF', icon: 'fa-file-pdf' }
	];
	const PDF_PRESETS = [
		{ value: 'A4', label: 'A4', note: '595 × 842' },
		{ value: 'A4_LANDSCAPE', label: 'A4 Landscape', note: '842 × 595' },
		{ value: 'LETTER', label: 'Letter', note: '612 × 792' },
		{ value: 'LETTER_LANDSCAPE', label: 'Letter Landscape', note: '792 × 612' },
		{ value: 'LEGAL', label: 'Legal', note: '612 × 1008' },
		{ value: 'A3', label: 'A3', note: '842 × 1191' },
		{ value: 'TABLOID', label: 'Tabloid', note: '792 × 1224' }
	];

	$: dimensionError =
		width > MAX_DIM || height > MAX_DIM
			? `Max ${MAX_DIM}px per side`
			: width < 10 || height < 10
				? 'Min 10px per side'
				: null;

	function patch(p) {
		dispatch('change', p);
	}

	function onWidth(e) {
		const v = parseInt(e.target.value, 10) || 0;
		width = v;
		if (!dimensionError) patch({ width: v });
	}
	function onHeight(e) {
		const v = parseInt(e.target.value, 10) || 0;
		height = v;
		if (!dimensionError) patch({ height: v });
	}
</script>

<div class="flex h-full w-full flex-col bg-[#FFFDF8]">
	<!-- Accent header strip -->
	<div class="border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4">
		<h2 class="text-lg font-black uppercase tracking-widest text-gray-900">Settings</h2>
		<p class="mt-0.5 text-[11px] font-bold text-gray-800">
			Output format, dimensions, and per-render toggles.
		</p>
	</div>

	<div class="flex-1 overflow-auto p-6">
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- OUTPUT FORMAT card -->
			<section
				class="rounded-xl border-[3px] border-gray-900 bg-white p-5 shadow-[4px_4px_0_0_#1f2937]"
			>
				<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
					>Output format</label>
				<div class="mt-3 grid grid-cols-3 gap-2">
					{#each FORMATS as fmt}
						<button
							type="button"
							class="flex flex-col items-center justify-center gap-1 rounded-lg border-[3px] border-gray-900 px-3 py-3 text-[11px] font-black uppercase tracking-widest transition-all
								{format === fmt.key
									? 'bg-[#ffc480] text-gray-900 shadow-[3px_3px_0_0_#1f2937] -translate-x-[1px] -translate-y-[1px]'
									: 'bg-white text-gray-900 hover:shadow-[3px_3px_0_0_#1f2937] hover:-translate-x-[1px] hover:-translate-y-[1px]'}"
							on:click={() => {
								format = fmt.key;
								patch({ format });
							}}
						>
							<i class="fa {fmt.icon} text-base"></i>
							{fmt.label}
						</button>
					{/each}
				</div>

				{#if format === 'pdf'}
					<div class="mt-5 space-y-2">
						<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
							>PDF preset</label>
						<select
							value={pdfPreset}
							on:change={(e) => {
								pdfPreset = e.target.value;
								patch({ pdfPreset });
							}}
							class="w-full rounded-lg border-[3px] border-gray-900 bg-white px-4 py-2.5 text-sm font-black uppercase tracking-wider text-gray-900 transition-all focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#ffc480] focus:outline-none"
						>
							{#each PDF_PRESETS as p}
								<option value={p.value}>{p.label} — {p.note}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="mt-5 grid grid-cols-2 gap-3">
						<div>
							<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
								>Width (px)</label>
							<input
								type="number"
								min="10"
								max={MAX_DIM}
								value={width}
								on:input={onWidth}
								class="mt-2 w-full rounded-lg border-[3px] border-gray-900 bg-white px-4 py-2.5 text-sm font-black text-gray-900 transition-all focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#ffc480] focus:outline-none"
							/>
						</div>
						<div>
							<label class="block text-[10px] font-black uppercase tracking-widest text-gray-900"
								>Height (px)</label>
							<input
								type="number"
								min="10"
								max={MAX_DIM}
								value={height}
								on:input={onHeight}
								class="mt-2 w-full rounded-lg border-[3px] border-gray-900 bg-white px-4 py-2.5 text-sm font-black text-gray-900 transition-all focus:-translate-y-1 focus:shadow-[4px_4px_0_0_#ffc480] focus:outline-none"
							/>
						</div>
						{#if dimensionError}
							<p class="col-span-2 text-[11px] font-black uppercase tracking-wider text-[#ff5252]">
								<i class="fa fa-triangle-exclamation mr-1 text-[10px]"></i>
								{dimensionError}
							</p>
						{/if}
					</div>
				{/if}
			</section>

			<!-- STRICT VARIABLES toggle card -->
			<section
				class="rounded-xl border-[3px] border-gray-900 bg-white p-5 shadow-[4px_4px_0_0_#1f2937]"
			>
				<label class="flex cursor-pointer items-start gap-4">
					<input
						type="checkbox"
						checked={strictVariables}
						on:change={(e) => {
							strictVariables = e.target.checked;
							patch({ strictVariables });
						}}
						class="mt-1 h-5 w-5 accent-[#ffc480]"
					/>
					<div class="flex-1">
						<p class="text-sm font-black uppercase tracking-wider text-gray-900">
							Strict variables
						</p>
						<p class="mt-1 text-xs font-bold text-gray-600">
							When ON, missing root-level variables throw HTTP 422 at render time. Leave off if
							you use conditionals like
							<code class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-1.5 py-0.5 font-mono text-[11px] text-[#ffc480]"
								>{'{{#if optional}}'}</code>.
						</p>
					</div>
				</label>
			</section>

			<!-- JS ENABLED toggle card — danger-red treatment when ON -->
			<section
				class="rounded-xl border-[3px] p-5 shadow-[4px_4px_0_0_#1f2937] transition-colors
					{jsEnabled ? 'border-gray-900 bg-[#ff6b6b]/10' : 'border-gray-900 bg-white'}"
			>
				<label class="flex cursor-pointer items-start gap-4">
					<input
						type="checkbox"
						checked={jsEnabled}
						on:change={(e) => {
							jsEnabled = e.target.checked;
							patch({ jsEnabled });
						}}
						class="mt-1 h-5 w-5 accent-[#ff6b6b]"
					/>
					<div class="flex-1">
						<p class="text-sm font-black uppercase tracking-wider text-gray-900">
							Run JavaScript during render
						</p>
						<p class="mt-1 text-xs font-bold text-gray-600">
							Enables Chart.js, KaTeX, and animated SVG. Disables our protection
							against infinite loops. 30s hard timeout still applies.
						</p>
					</div>
				</label>

				{#if jsEnabled}
					<div
						class="mt-4 flex items-start gap-3 rounded-lg border-[2px] border-gray-900 bg-[#ff6b6b] px-4 py-3 text-white shadow-[2px_2px_0_0_#1f2937]"
					>
						<i class="fa fa-triangle-exclamation text-xs mt-0.5"></i>
						<div>
							<p class="text-[11px] font-black uppercase tracking-widest">JavaScript is ON</p>
							<p class="mt-1 text-[11px] font-bold text-white/90">
								Scripts in your template will execute. Avoid
								<code class="font-mono text-[11px]">eval</code>, remote
								<code class="font-mono text-[11px]">&lt;script&gt;</code> tags, and any
								code that could run indefinitely.
							</p>
						</div>
					</div>
				{/if}
			</section>
		</div>
	</div>
</div>
