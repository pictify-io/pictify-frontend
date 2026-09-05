<script>
	/**
	 * What the last AI edit actually did. AI-2 / AI-6 state A2.
	 *
	 * A DIFF, NOT PROSE. The agent's own sentence is shown above this when it
	 * wrote one, but the lines here come from a server-side comparison of the
	 * document before and after — so "Nothing else changed · verified" is a
	 * claim about a check that ran, not about what the model believes it did.
	 *
	 * When the two documents could not be compared node for node (a rewrite that
	 * dropped most identities), the second line says "not compared" instead.
	 * The handoff fixes that phrase for exactly this case: a receipt nobody can
	 * check is worse than no receipt.
	 */
	import { createEventDispatcher } from 'svelte';

	/** `{ changed:[{id,name,summary}], added:[], removed:[], untouched:{nodes,verified} }` */
	export let receipt = null;
	/** Node labels the edit was scoped to, or null for a whole-design edit. */
	export let scope = null;
	export let canUndo = false;
	/**
	 * The layers tree, used to name nodes the way the rest of the studio does.
	 *
	 * The server derives a name from the element's own text, so a field element
	 * came back as "{{account_name}}" while Layers called the same thing
	 * "account_name". Two names for one element in one screen is the kind of
	 * detail that makes a receipt feel like it is describing something else.
	 * Ids are the contract; names are presentation, so they are resolved here.
	 */
	export let layers = [];

	const dispatch = createEventDispatcher();
	let showDetails = false;

	$: byId = new Map((layers || []).map((l) => [l.id, l.label]));
	$: changed = (receipt?.changed || []).map((c) => ({ ...c, name: byId.get(c.id) || c.name }));
	$: headline =
		changed.length === 0
			? 'No visible change'
			: changed.length === 1
			? `${changed[0].name} · ${changed[0].summary}`
			: `${changed.length} elements changed`;
</script>

{#if receipt}
	<div class="border-l-2 border-brand-proof pl-3">
		<p class="flex items-start gap-2.5">
			<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
			<span class="font-sans text-[13.5px] leading-[19px] text-brand-ink">{headline}</span>
		</p>

		<p class="mt-1 pl-[18px] font-sans text-[12.5px] text-brand-slate">
			{#if receipt.untouched?.verified}
				Nothing else changed · verified
			{:else}
				<!-- Honest about the limit rather than silently dropping the line. -->
				Rest of the design · not compared
			{/if}
			{#if scope?.length}
				· scoped to {scope.join(', ')}
			{/if}
		</p>

		<p class="mt-1.5 flex items-center gap-4 pl-[18px]">
			<button
				type="button"
				on:click={() => (showDetails = !showDetails)}
				aria-expanded={showDetails}
				class="font-sans text-[12.5px] text-brand-blue underline-offset-2 hover:underline"
				>Details</button
			>
			{#if canUndo}
				<button
					type="button"
					on:click={() => dispatch('undo')}
					class="font-sans text-[12.5px] text-brand-blue underline-offset-2 hover:underline"
					>Undo</button
				>
			{/if}
		</p>

		{#if showDetails}
			<!-- The full list lives behind Details, per the layout pass: no
			     explanatory paragraphs inside the card itself. -->
			<dl class="mt-2 pl-[18px]">
				{#each changed as item (item.id)}
					<div class="py-1">
						<dt class="font-sans text-[12.5px] text-brand-ink">{item.name}</dt>
						<!-- The FULL list here, since the headline only kept two phrases. -->
						<dd class="mt-0.5 font-mono text-[10.5px] leading-[16px] text-brand-slate">
							{(item.parts || [item.summary]).join(' · ')}
						</dd>
					</div>
				{/each}
				{#each receipt.added || [] as name (name)}
					<div class="py-1 font-sans text-[12.5px] text-brand-slate">added {name}</div>
				{/each}
				{#each receipt.removed || [] as name (name)}
					<div class="py-1 font-sans text-[12.5px] text-brand-slate">removed {name}</div>
				{/each}
				{#if receipt.untouched?.verified}
					<div class="py-1 font-mono text-[10.5px] text-brand-mute">
						{receipt.untouched.nodes} elements checked, unchanged
					</div>
				{/if}
			</dl>
		{/if}
	</div>
{/if}
