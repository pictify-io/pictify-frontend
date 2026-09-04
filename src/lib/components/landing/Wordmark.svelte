<script>
	/** Inverted variant for dark grounds (footer). */
	import BrandMark from '../BrandMark.svelte';

	export let inverted = false;
	export let size = 24;
</script>

<span class="flex items-center gap-2.5">
	<BrandMark {size} {inverted} />
	<span
		class="font-display text-[19px] font-bold tracking-[-0.02em] lg:text-[23px] {inverted
			? 'text-white'
			: 'text-brand-ink'}"
	>
		Pictify
	</span>
</span>
