<script>
	/**
	 * Identity and the two commitments: what shape the file is, and make one.
	 *
	 * The format chip is a popover rather than a settings page because changing
	 * output shape is a thing you do while looking at the proof, and bouncing to
	 * another screen to do it would break the loop the studio exists to keep.
	 */
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let name = 'Untitled';
	export let saveState = 'saved'; // 'saved' | 'saving' | 'error'
	export let outputFormat = 'image';
	export let width = 1080;
	export let height = 1080;
	export let pdfPreset = 'A4';
	export let rendering = false;
	export let renderDisabled = false;

	let formatOpen = false;
	let menuOpen = false;
	let renaming = false;
	let draftName = name;

	const PRESETS = [
		{ label: 'OG 1200×630', width: 1200, height: 630 },
		{ label: 'Square 1080', width: 1080, height: 1080 },
		{ label: 'A4', width: 1240, height: 1754 }
	];

	$: chipLabel =
		outputFormat === 'pdf' ? `PDF · ${pdfPreset}` : `PNG · ${width}×${height}`;

	function commitName() {
		renaming = false;
		const next = draftName.trim();
		if (next && next !== name) dispatch('rename', { name: next });
		else draftName = name;
	}

	function applyPreset(p) {
		dispatch('format', { outputFormat, width: p.width, height: p.height, pdfPreset });
	}
</script>

<header class="flex flex-shrink-0 items-center gap-3 border-b border-brand-rule bg-brand-paper px-4 py-2.5">
	<a
		href="/dashboard/template"
		aria-label="Back to templates"
		class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-btn border border-brand-rule text-brand-slate hover:border-brand-ink hover:text-brand-ink"
	>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</a>

	{#if renaming}
		<input
			bind:value={draftName}
			on:blur={commitName}
			on:keydown={(e) => {
				if (e.key === 'Enter') commitName();
				if (e.key === 'Escape') {
					draftName = name;
					renaming = false;
				}
			}}
			class="min-w-0 flex-shrink rounded-btn border-[1.5px] border-brand-ink px-2 py-1 font-sans text-[15px] font-bold text-brand-ink outline-none"
		/>
	{:else}
		<button
			type="button"
			on:click={() => {
				draftName = name;
				renaming = true;
			}}
			class="min-w-0 truncate font-sans text-[15px] font-bold text-brand-ink hover:underline"
			title="Rename"
		>
			{name}
		</button>
	{/if}

	<span class="flex flex-shrink-0 items-center gap-1.5">
		<span
			class="block h-2 w-2 {saveState === 'error'
				? 'bg-brand-alarm'
				: saveState === 'saving'
					? 'animate-pulse bg-brand-field'
					: 'bg-brand-proof'}"
			aria-hidden="true"
		></span>
		<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
			{saveState === 'error' ? 'Not saved' : saveState === 'saving' ? 'Saving' : 'Saved'}
		</span>
	</span>

	<span class="flex-1"></span>

	<div class="relative flex-shrink-0">
		<button
			type="button"
			on:click={() => (formatOpen = !formatOpen)}
			aria-expanded={formatOpen}
			class="rounded-btn border-[1.5px] border-brand-rule px-3 py-1.5 font-mono text-xs tracking-[0.04em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
		>
			{chipLabel}
		</button>
		{#if formatOpen}
			<div class="absolute right-0 top-full z-30 mt-1.5 flex w-[268px] flex-col gap-3.5 rounded-tile border border-black/10 bg-white p-4 shadow-lg">
				<div class="flex flex-col gap-2">
					<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Format</span>
					<div class="flex gap-1.5">
						{#each [{ v: 'image', l: 'PNG' }, { v: 'pdf', l: 'PDF' }] as f (f.v)}
							<button
								type="button"
								on:click={() => dispatch('format', { outputFormat: f.v, width, height, pdfPreset })}
								class="rounded-btn border-[1.5px] px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] {outputFormat === f.v
									? 'border-brand-ink bg-brand-field text-brand-ink'
									: 'border-brand-rule text-brand-slate hover:border-brand-ink'}"
							>
								{f.l}
							</button>
						{/each}
					</div>
				</div>

				{#if outputFormat !== 'pdf'}
					<div class="flex flex-col gap-2">
						<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Size</span>
						<div class="flex items-center gap-2">
							<input
								type="number"
								value={width}
								min="16"
								max="8000"
								on:change={(e) =>
									dispatch('format', {
										outputFormat,
										width: Number(e.currentTarget.value) || width,
										height,
										pdfPreset
									})}
								class="w-full rounded-btn border-[1.5px] border-brand-rule px-2 py-1.5 font-mono text-xs text-brand-ink outline-none focus:border-brand-ink"
							/>
							<span class="font-mono text-xs text-brand-mute">×</span>
							<input
								type="number"
								value={height}
								min="16"
								max="8000"
								on:change={(e) =>
									dispatch('format', {
										outputFormat,
										width,
										height: Number(e.currentTarget.value) || height,
										pdfPreset
									})}
								class="w-full rounded-btn border-[1.5px] border-brand-rule px-2 py-1.5 font-mono text-xs text-brand-ink outline-none focus:border-brand-ink"
							/>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each PRESETS as p (p.label)}
								<button
									type="button"
									on:click={() => applyPreset(p)}
									class="rounded-btn border border-brand-rule px-2 py-1 font-mono text-[10px] tracking-[0.04em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
								>
									{p.label}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="relative flex flex-shrink-0">
		<button
			type="button"
			on:click={() => dispatch('render')}
			disabled={rendering || renderDisabled}
			title={renderDisabled ? 'Fix the proof before rendering' : 'Render with these inputs'}
			class="flex items-center gap-2 rounded-l-btn bg-brand-ink px-4 py-2 font-sans text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
		>
			{rendering ? 'Rendering…' : 'Render'}
			<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
		</button>
		<button
			type="button"
			on:click={() => (menuOpen = !menuOpen)}
			aria-label="More render options"
			aria-expanded={menuOpen}
			class="rounded-r-btn border-l border-white/20 bg-brand-ink px-2 py-2 text-white transition-opacity hover:opacity-90"
		>
			<span class="block text-[10px] leading-none">▾</span>
		</button>
		{#if menuOpen}
			<div class="absolute right-0 top-full z-30 mt-1.5 w-[220px] overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
				<button
					type="button"
					on:click={() => {
						menuOpen = false;
						dispatch('renderMany');
					}}
					class="w-full px-3 py-2.5 text-left font-sans text-[13px] text-brand-ink hover:bg-brand-canvas"
				>
					Render many from a sheet
				</button>
			</div>
		{/if}
	</div>
</header>
