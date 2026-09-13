<script>
	/**
	 * The Pictify wordmark: bolt mark + "Pictify" in Bricolage bold.
	 *
	 * One definition for every surface. The landing header, the dashboard rail,
	 * login and onboarding each set the word in their own weight and tracking
	 * for a while and drifted apart; this is the only place the type is set.
	 */
	import BrandMark from '../BrandMark.svelte';

	/** Inverted variant for dark grounds (footer). */
	export let inverted = false;
	/** Mark size in px. */
	export let size = 24;
	/** Word size: 'md' (19px, steps to 23 on lg when responsive) or 'lg' (21px). */
	export let text = 'md';
	/** Landing chrome steps the word up on wide screens; app chrome stays fixed. */
	export let responsive = true;

	// Literal class strings so Tailwind's JIT sees every combination.
	$: wordClass =
		text === 'lg' ? 'text-[21px]' : responsive ? 'text-[19px] lg:text-[23px]' : 'text-[19px]';
</script>

<span class="flex items-center gap-2.5">
	<BrandMark {size} {inverted} />
	<span
		class="font-display font-bold tracking-[-0.02em] {wordClass} {inverted
			? 'text-white'
			: 'text-brand-ink'}"
	>
		Pictify
	</span>
</span>
