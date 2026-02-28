<script>
	import { slide } from 'svelte/transition';
	import { sectionHeaderClass } from './tokens.js';

	/** @type {string} */
	export let title = '';

	/** @type {boolean} */
	export let open = true;

	/** @type {boolean} - show top border separator */
	export let border = true;
</script>

<div class={border ? 'pt-4 border-t border-gray-200' : ''}>
	<button
		class="flex items-center justify-between w-full mb-3 group"
		on:click={() => (open = !open)}
		aria-expanded={open}
	>
		<span class={sectionHeaderClass}>
			{title}<slot name="title-extra" />
		</span>
		<i
			class="fa fa-chevron-{open ? 'up' : 'down'} text-[10px] text-gray-300 group-hover:text-gray-500 transition-colors"
		/>
	</button>
	{#if open}
		<div transition:slide={{ duration: 150 }}>
			<slot />
		</div>
	{/if}
</div>
