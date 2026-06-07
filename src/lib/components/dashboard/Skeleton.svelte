<!--
  Skeleton placeholder — neo-brutalist shimmer block.
  Reduced-motion is handled globally in app.css (animations collapse to
  0.01 ms for users who prefer reduced motion), so animate-pulse is safe here.
-->
<script>
	// Forward any extra classes (width, height, shape overrides) via the
	// standard Svelte class prop + $$restProps spread.
	let className = '';
	export { className as class };

	// Optional explicit border for skeleton cards that mirror bordered content.
	export let border = false;
</script>

<div
	class="bg-gray-200 rounded-lg animate-pulse {border
		? 'border-[2px] border-gray-300'
		: ''} {className}"
	{...$$restProps}
/>
