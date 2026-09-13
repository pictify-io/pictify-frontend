<script>
	/**
	 * The Inputs rail. B03-1 / B03-2.
	 *
	 * Answers one question the buyer cannot answer by looking at the canvas:
	 * does this design work for every row, not just the one on screen?
	 *
	 * So it lists the fields the design binds, whether the campaign actually
	 * supplies each one, and a per-sample fit result. A field the design uses
	 * that the campaign does not define is shown as UNRESOLVED rather than
	 * quietly rendering empty — an empty space on a customer's card is
	 * indistinguishable from a zero.
	 */
	import { createEventDispatcher } from 'svelte';
	import StatusSquare from '$lib/components/campaigns/StatusSquare.svelte';
	import { SAMPLE_CASES } from './samples.js';

	/** Field keys the design binds, from the live document. */
	export let used = [];
	/** Field keys the campaign supplies. */
	export let available = [];
	/** `{ [sampleId]: issues[] }` from the last check. */
	export let bySample = {};
	export let activeSample = 'typical';

	const dispatch = createEventDispatcher();

	const BUILT_IN = new Set(['account_name', 'account_id', 'period', 'brand_name']);

	$: resolved = used.filter((f) => BUILT_IN.has(f) || available.includes(f));
	$: unresolved = used.filter((f) => !BUILT_IN.has(f) && !available.includes(f));
	$: unused = available.filter((f) => !used.includes(f));
</script>

<div class="flex flex-col gap-5">
	<div>
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">Sample</p>
		<div class="mt-2 flex flex-col gap-1">
			{#each SAMPLE_CASES as sample (sample.id)}
				<button
					type="button"
					on:click={() => dispatch('sample', { id: sample.id })}
					class="flex items-center justify-between gap-2 rounded-[4px] px-2 py-1.5 text-left {activeSample ===
					sample.id
						? 'bg-brand-subtle'
						: 'hover:bg-brand-subtle/60'}"
					aria-pressed={activeSample === sample.id}
				>
					<span class="min-w-0">
						<span
							class="block font-sans text-[13px] {activeSample === sample.id
								? 'font-semibold text-brand-ink'
								: 'text-brand-slate'}">{sample.label}</span
						>
						<!-- Why this sample exists, so switching to it is a decision. -->
						<span class="block font-mono text-[9.5px] text-brand-mute">{sample.why}</span>
					</span>
					{#if bySample[sample.id]}
						<span class="flex-shrink-0">
							{#if bySample[sample.id].length}
								<span class="block h-2 w-2 bg-brand-alarm" aria-hidden="true" title="Overflows" />
							{:else}
								<span class="block h-2 w-2 bg-brand-proof" aria-hidden="true" title="Fits" />
							{/if}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div>
		<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
			Fields in this design
		</p>
		{#if !used.length}
			<p class="mt-2 font-sans text-[13px] text-brand-mute">
				Nothing bound yet. Use <span class="font-mono">+ Field</span> to place one.
			</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-1.5">
				{#each resolved as field (field)}
					<li><StatusSquare tone="ready" label={field} /></li>
				{/each}
				{#each unresolved as field (field)}
					<li>
						<!-- Named, not silently empty: a blank space on a customer's card
						     is indistinguishable from a zero. -->
						<StatusSquare tone="blocked" label={`${field} · not supplied by this campaign`} />
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if unused.length}
		<div>
			<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
				Available, not used
			</p>
			<div class="mt-2 flex flex-wrap gap-1.5">
				{#each unused as field (field)}
					<button
						type="button"
						on:click={() => dispatch('insert', { field })}
						class="rounded-[3px] bg-brand-powder px-2 py-1 font-mono text-[11px] text-brand-royal"
						title="Place this field on the canvas">{field}</button
					>
				{/each}
			</div>
		</div>
	{/if}
</div>
