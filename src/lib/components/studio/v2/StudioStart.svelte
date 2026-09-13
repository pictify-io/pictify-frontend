<script>
	/**
	 * Studio start state. B01-2 (board `H03-0`).
	 *
	 * The first screen of a new design, and the one place the product decides
	 * what "starting" means. Two rules shape it:
	 *
	 *   NOTHING IS DRAWN UNTIL THE BUYER PRESSES CREATE. Picking a starter fills
	 *   the description; it does not generate. A picker that silently produced a
	 *   draft would spend an AI call and put something on the canvas the buyer
	 *   did not ask for, which they then have to undo rather than begin from.
	 *   THE FIELDS ARE THE CAMPAIGN'S. The description names what the design may
	 *   bind to, so the count is shown rather than left to be discovered when a
	 *   field turns out not to exist.
	 */
	import { createEventDispatcher } from 'svelte';
	import { STARTERS } from '$lib/campaigns/starters';

	/** Field keys this campaign can bind — used for the count, not for display. */
	export let availableFields = [];
	export let busy = false;

	const dispatch = createEventDispatcher();

	const FORMATS = [
		{ key: 'png', title: 'PNG email card', detail: '1200 × 800 · pastes into any email tool' },
		{ key: 'pdf', title: 'One-page PDF', detail: 'A4 or Letter · attaches to the email' }
	];

	let format = 'png';
	let description = '';

	/**
	 * A starter fills the box. The buyer can then edit it before creating, which
	 * is the difference between a starting point and a template.
	 */
	const STARTER_PROMPTS = {
		'value-card-png':
			'A monthly value card for our customers. Company name up top, the two metrics as big numbers, our brand colour, and a thank-you line.',
		'value-summary-pdf':
			'A one-page summary for our customers. Company name, the period, the metrics as large figures, and a short note explaining how the estimate was produced.'
	};
	const STARTER_ROWS = [
		{ key: 'value-card-png', label: 'Value card · numbers first' },
		{ key: 'value-summary-pdf', label: 'Quarter one-pager · PDF' }
	];

	function useStarter(key) {
		description = STARTER_PROMPTS[key] || description;
		const starter = STARTERS.find((s) => s.key === key);
		if (starter) format = starter.format;
	}

	function create() {
		if (!description.trim() || busy) return;
		dispatch('create', { description: description.trim(), format });
	}

	function onKey(event) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') create();
	}
</script>

<div class="flex flex-col gap-5">
	<div>
		<h2 class="font-display text-[19px] font-bold leading-snug text-brand-ink">
			Describe the card. AI drafts it. You make it yours.
		</h2>
		<p class="mt-1.5 font-sans text-[13.5px] text-brand-slate">
			Uses your brand and this campaign’s fields. Sample values only.
		</p>
	</div>

	<div>
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Format</p>
		<div class="mt-2 flex flex-col gap-2">
			{#each FORMATS as option (option.key)}
				<button
					type="button"
					on:click={() => (format = option.key)}
					class="flex items-start gap-2.5 rounded-md border-2 p-3 text-left {format === option.key
						? 'border-brand-ink'
						: 'border-brand-rule'}"
					aria-pressed={format === option.key}
				>
					<span
						class="mt-0.5 block h-4 w-4 flex-shrink-0 border-2 {format === option.key
							? 'border-brand-ink bg-brand-ink'
							: 'border-brand-slate'}"
					/>
					<span class="min-w-0">
						<span class="block font-sans text-[13.5px] font-bold text-brand-ink"
							>{option.title}</span
						>
						<span class="mt-0.5 block font-sans text-[12.5px] text-brand-slate"
							>{option.detail}</span
						>
					</span>
				</button>
			{/each}
		</div>
	</div>

	<div>
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Describe it</p>
		<textarea
			bind:value={description}
			on:keydown={onKey}
			rows="5"
			placeholder="A monthly value card for our customers…"
			class="mt-2 w-full rounded-md border-2 border-brand-ink px-3 py-2.5 font-sans text-[13.5px] text-brand-ink placeholder:text-brand-mute"
		/>
		<div class="mt-1 flex items-center justify-between">
			<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
				>Fields: {availableFields.length} available</span
			>
			<span class="font-mono text-[10px] text-brand-mute">⌘⏎</span>
		</div>
	</div>

	<button
		type="button"
		on:click={create}
		disabled={!description.trim() || busy}
		class="flex h-11 items-center justify-center rounded-btn px-4 font-sans text-[13.5px] {description.trim() &&
		!busy
			? 'bg-brand-ink text-white'
			: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
	>
		{busy ? 'Drafting…' : 'Create first draft'}
	</button>

	<div>
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Or start from</p>
		<div class="mt-2 flex flex-col gap-1.5">
			{#each STARTER_ROWS as row (row.key)}
				<button
					type="button"
					on:click={() => useStarter(row.key)}
					class="flex items-center gap-2.5 rounded-md border border-brand-rule px-3 py-2.5 text-left"
				>
					<span class="block h-2 w-2 flex-shrink-0 bg-brand-blue" aria-hidden="true" />
					<span class="font-sans text-[13px] text-brand-slate">{row.label}</span>
				</button>
			{/each}
		</div>
		<!-- Stated, because a picker that generated on click would spend an AI
		     call and put something on the canvas nobody asked for. -->
		<p class="mt-2 font-sans text-[12.5px] text-brand-mute">
			Starters fill the description; nothing is drawn until you press Create.
		</p>
	</div>
</div>
