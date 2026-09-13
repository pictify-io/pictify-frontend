<script>
	/**
	 * A phone, drawn. FE-17.
	 *
	 * Decorative chrome around a real specimen: the frame is `aria-hidden` and
	 * contributes nothing to the accessibility tree, because "a rounded
	 * rectangle with a status bar" is not information. What is inside it is.
	 */
	export let time = '9:41';
	let className = '';
	export { className as class };
</script>

<div
	class="rounded-[28px] border-[6px] border-brand-ink bg-white p-2.5 shadow-[6px_6px_0_0_rgba(0,0,0,0.10)] {className}"
>
	<div class="flex items-center justify-between px-1.5 pb-2 pt-0.5" aria-hidden="true">
		<span class="font-sans text-[11px] font-semibold text-brand-ink">{time}</span>
		<span class="h-1.5 w-6 rounded-full bg-brand-ink/70" />
	</div>
	<slot />
</div>
