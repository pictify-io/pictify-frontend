<script>
	/**
	 * The job ticket — the product action as the home's hero. Format is never
	 * picked here: the agent reads it from the brief, so the chips are an
	 * inference display, not a selector. The tear-line is the ticket telling
	 * you it's a ticket.
	 */
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let prompt = '';
	export let busy = false;

	const FORMATS = ['PNG', 'PDF', 'GIF', 'MP4'];
	const CHIPS = [
		{ label: 'A certificate', seed: 'A certificate for people who finish our course — our logo, their name, the date and the course title.' },
		{ label: 'An OG image', seed: 'An OG image for every blog post — post title, author name and our logo on our brand colors.' },
		{ label: 'An invoice PDF', seed: 'An invoice PDF — our company details, line items with amounts, and a total, A4.' },
		{ label: 'A countdown GIF', seed: 'A countdown GIF for our launch email — days remaining in big type on our brand colors.' }
	];

	// The prompt names a format only when the user says so; light the chip the
	// moment the brief implies one so the "AUTO" claim is visibly true.
	$: inferred = (() => {
		const p = prompt.toLowerCase();
		if (/\bpdf\b|invoice|statement|report\b/.test(p)) return 'PDF';
		if (/\bgif\b|countdown|animat/.test(p)) return 'GIF';
		if (/\bvideo\b|mp4|recap/.test(p)) return 'MP4';
		if (p.trim()) return 'PNG';
		return null;
	})();

	function submit() {
		if (!prompt.trim() || busy) return;
		dispatch('generate', { prompt });
	}
</script>

<div class="flex flex-col overflow-hidden rounded-tile border-2 border-brand-ink bg-white shadow-[5px_5px_0_theme(colors.brand.field)]">
	<textarea
		bind:value={prompt}
		rows="2"
		placeholder="A certificate for people who finish our course — our logo, their name, the date, in our brand's colors…"
		on:keydown={(e) => {
			if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
		}}
		class="w-full resize-none bg-transparent px-5 pb-2 pt-5 font-sans text-base leading-6 text-brand-ink outline-none placeholder:text-brand-mute"
	></textarea>

	<div class="mx-5 border-t-[1.5px] border-dashed border-brand-ink/25" aria-hidden="true"></div>

	<div class="flex flex-col gap-3 px-5 pb-[18px] pt-3.5 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex flex-wrap items-center gap-2">
			{#each CHIPS as chip (chip.label)}
				<button
					type="button"
					on:click={() => (prompt = chip.seed)}
					class="rounded-btn border-[1.5px] border-brand-rule px-3 py-1.5 font-sans text-[12.5px] font-semibold text-brand-slate transition-colors hover:border-brand-ink hover:text-brand-ink"
				>
					{chip.label}
				</button>
			{/each}
			<span class="hidden pl-1 font-sans text-[12.5px] text-brand-slate xl:block">
				Paste a URL — we'll read the brand.
			</span>
		</div>
		<div class="flex flex-shrink-0 items-center gap-3 self-start lg:self-auto">
			<div class="hidden items-center gap-1.5 sm:flex" aria-label="Output format, inferred from the brief">
				{#each FORMATS as f (f)}
					<span
						class="rounded-[3px] px-2 py-[3px] font-mono text-[10px] tracking-[0.06em] {inferred === f
							? 'bg-brand-field text-brand-ink'
							: 'border border-brand-rule text-brand-slate'}"
					>
						{f}
					</span>
				{/each}
			</div>
			<button
				type="button"
				on:click={submit}
				disabled={!prompt.trim() || busy}
				class="flex items-center gap-2.5 rounded-btn bg-brand-ink px-5 py-[11px] font-sans text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
			>
				{busy ? 'Generating…' : 'Generate template'}
				<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
			</button>
		</div>
	</div>
</div>
