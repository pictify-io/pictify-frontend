<script>
	import { createEventDispatcher } from 'svelte';

	export let message = '';
	export let cta = '';
	export let href = '';

	const dispatch = createEventDispatcher();
</script>

<div
	class="bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0_0_black] p-4 flex items-center gap-4 group hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
>
	<!-- Lightbulb icon -->
	<div
		class="w-10 h-10 bg-[#ffc480]/20 rounded-xl border-[2px] border-[#ffc480] flex items-center justify-center flex-shrink-0"
	>
		<svg class="w-5 h-5 text-[#ffc480]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2.5"
				d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
			/>
		</svg>
	</div>

	<!-- Message -->
	<div class="flex-1 min-w-0">
		<p class="text-sm font-bold text-black leading-snug">{message}</p>
	</div>

	<!-- CTA -->
	{#if cta && href}
		<a
			{href}
			class="flex-shrink-0 px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#ffc480] text-black border-[2px] border-black rounded-lg shadow-[2px_2px_0_0_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
		>
			{cta}
		</a>
	{/if}

	<!-- Close button -->
	<button
		on:click|stopPropagation={() => dispatch('dismiss')}
		class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
		aria-label="Dismiss"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2.5"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	</button>
</div>
