<script>
	/**
	 * HtmlSettingsPanel — template-level toggles and metadata.
	 *
	 *   - jsEnabled (warning strip when ON)
	 *   - strictVariables
	 *   - width / height  (MAX_DIMENSION = 4096)
	 *   - format (image | pdf)
	 *   - pdfPreset  (shown when format=pdf)
	 *
	 * Per design spec: two-column form, thick borders, inline validation
	 * message for dimensions over the cap, warning strip with left-accent
	 * danger border when jsEnabled flips on.
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
	const PDF_PRESETS = [
		'A4',
		'A4_LANDSCAPE',
		'LETTER',
		'LETTER_LANDSCAPE',
		'LEGAL',
		'A3',
		'TABLOID'
	];

	$: dimensionError =
		width > MAX_DIM || height > MAX_DIM
			? `Dimensions cap is ${MAX_DIM}px per side`
			: width < 10 || height < 10
				? 'Dimensions must be at least 10px'
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

<div class="flex h-full w-full flex-col bg-brand-bg">
	<div class="border-b-3 border-gray-800 px-6 py-4">
		<h2 class="font-heading text-xl text-gray-900">Settings</h2>
	</div>

	<div class="flex-1 overflow-auto px-6 py-6">
		<div class="grid grid-cols-2 gap-5">
			<!-- Format -->
			<label class="col-span-2 flex flex-col gap-1.5">
				<span class="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
					>Output format</span
				>
				<div class="flex gap-2">
					{#each ['png', 'jpeg', 'pdf'] as fmt}
						<button
							type="button"
							class="border-3 border-gray-800 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider shadow-brutal-sm transition-transform duration-150 hover:-translate-y-[1px] focus-brutal"
							class:bg-brand-accent={format === fmt}
							class:bg-white={format !== fmt}
							on:click={() => {
								format = fmt;
								patch({ format });
							}}
						>
							{fmt}
						</button>
					{/each}
				</div>
			</label>

			{#if format === 'pdf'}
				<label class="col-span-2 flex flex-col gap-1.5">
					<span class="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>PDF preset</span
					>
					<select
						value={pdfPreset}
						on:change={(e) => {
							pdfPreset = e.target.value;
							patch({ pdfPreset });
						}}
						class="border-3 border-gray-800 bg-white px-3 py-2 font-mono text-sm focus-brutal"
					>
						{#each PDF_PRESETS as p}
							<option value={p}>{p}</option>
						{/each}
					</select>
				</label>
			{:else}
				<!-- Dimensions (only meaningful for image formats) -->
				<label class="flex flex-col gap-1.5">
					<span class="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Width (px)</span
					>
					<input
						type="number"
						min="10"
						max={MAX_DIM}
						value={width}
						on:input={onWidth}
						class="border-3 border-gray-800 bg-white px-3 py-2 font-mono text-sm focus-brutal"
					/>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700"
						>Height (px)</span
					>
					<input
						type="number"
						min="10"
						max={MAX_DIM}
						value={height}
						on:input={onHeight}
						class="border-3 border-gray-800 bg-white px-3 py-2 font-mono text-sm focus-brutal"
					/>
				</label>
				{#if dimensionError}
					<p class="col-span-2 font-mono text-xs text-brand-danger">{dimensionError}</p>
				{/if}
			{/if}

			<!-- strictVariables -->
			<div
				class="col-span-2 mt-4 border-t-2 border-dashed border-gray-300 pt-5"
			/>

			<label class="col-span-2 flex items-start gap-3">
				<input
					type="checkbox"
					checked={strictVariables}
					on:change={(e) => {
						strictVariables = e.target.checked;
						patch({ strictVariables });
					}}
					class="mt-1 h-5 w-5 border-2 border-gray-800 accent-brand-accent"
				/>
				<div>
					<p class="font-mono text-sm font-semibold text-gray-900">Strict variables</p>
					<p class="mt-0.5 text-xs text-gray-600">
						When ON, missing root-level variables throw <code>422</code> at render
						time. Off by default so conditionals like
						<code>{'{{#if optional}}'}</code> don't fail.
					</p>
				</div>
			</label>

			<!-- jsEnabled -->
			<label class="col-span-2 flex items-start gap-3">
				<input
					type="checkbox"
					checked={jsEnabled}
					on:change={(e) => {
						jsEnabled = e.target.checked;
						patch({ jsEnabled });
					}}
					class="mt-1 h-5 w-5 border-2 border-gray-800 accent-brand-danger"
				/>
				<div>
					<p class="font-mono text-sm font-semibold text-gray-900">
						Run JavaScript during render
					</p>
					<p class="mt-0.5 text-xs text-gray-600">
						Only enable if your template relies on Chart.js, KaTeX, or
						animated SVG. Disables server-side protections against
						infinite loops, so renders may be slower and can be killed
						by the 30s timeout.
					</p>
				</div>
			</label>

			{#if jsEnabled}
				<div
					class="col-span-2 border-l-3 border-brand-danger bg-brand-danger/10 px-4 py-3 text-[13px] text-gray-900"
				>
					<p class="font-mono font-semibold">JavaScript is ON.</p>
					<p class="mt-1">
						Scripts in your template will execute. Avoid <code>eval</code>,
						remote script tags, and any code that could run indefinitely.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
