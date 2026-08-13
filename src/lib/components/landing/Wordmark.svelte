<script>
	/** Inverted variant for dark grounds (footer). */
	export let inverted = false;
	export let size = 24;
</script>

<span class="flex items-center gap-2.5">
	<svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
		<rect
			x="1.5"
			y="1.5"
			width="25"
			height="25"
			rx="7"
			fill={inverted ? '#FFFFFF' : '#000000'}
		/>
		<rect x="7" y="7" width="7" height="7" fill="#0078BF" />
		<rect x="14" y="14" width="7" height="7" fill="#D8F34A" />
	</svg>
	<span
		class="font-display text-[19px] font-bold tracking-[-0.02em] lg:text-[23px] {inverted
			? 'text-white'
			: 'text-brand-ink'}"
	>
		Pictify
	</span>
</span>
