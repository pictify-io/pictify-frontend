<script>
	/**
	 * The email the card arrives inside. FE-17.
	 *
	 * The page's whole non-technical pass rests on showing what the CUSTOMER
	 * sees, not what the buyer uploads — so the card is never presented alone
	 * outside the proof wall. It always has a subject line, a sender, a sentence
	 * and a button around it, because that is the artefact a CS lead recognises.
	 *
	 * The button is drawn, not linked. It belongs to the buyer's email, and a
	 * live link here would be a promise this page does not make.
	 */
	import ValueCard from './ValueCard.svelte';
	import { SENDER } from '$lib/campaigns/marketing-fixture.js';

	export let row;
	/** 'sm' inside the phone frame; 'md' in the before/after. */
	export let size = 'md';
	export let showButton = true;

	$: firstName = String(row.contact || '').split(' ')[0];
</script>

<div class="w-full bg-white {size === 'sm' ? 'p-3' : 'p-5'}">
	<p
		class="font-sans font-semibold text-brand-ink {size === 'sm' ? 'text-[12.5px]' : 'text-[15px]'}"
	>
		Your September with {SENDER.name}
	</p>
	<p class="mt-0.5 font-sans text-brand-mute {size === 'sm' ? 'text-[10.5px]' : 'text-[12.5px]'}">
		{SENDER.name} · to {row.contact}, {row.company}
	</p>
	<p
		class="mt-2.5 font-sans leading-[1.45] text-brand-slate {size === 'sm'
			? 'text-[11px]'
			: 'text-[13.5px]'}"
	>
		Hi {firstName}, here is what {row.company} did with {SENDER.name} in September.
	</p>

	<div class="mt-3 border border-brand-rule">
		<ValueCard {row} size={size === 'sm' ? 'sm' : 'md'} />
	</div>

	{#if showButton}
		<!-- Drawn, not a link: this button lives in the buyer's email, not on this page. -->
		<span
			class="mt-3 flex h-9 w-full items-center justify-center bg-brand-royal font-sans font-semibold text-white {size ===
			'sm'
				? 'text-[12px]'
				: 'text-[13.5px]'}"
			aria-hidden="true">Open your report</span
		>
	{/if}
</div>
