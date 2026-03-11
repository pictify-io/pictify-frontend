<script>
	import { createEventDispatcher } from 'svelte';
	import { tabActiveClass, tabInactiveClass } from './tokens.js';

	/** @type {Array<{ id: string, label: string, icon?: string, badge?: boolean }>} */
	export let tabs = [];

	/** @type {string} */
	export let activeTab = '';

	const dispatch = createEventDispatcher();

	function selectTab(id) {
		dispatch('change', id);
	}
</script>

<div class="flex gap-1 bg-[#FFFDF8] p-1 border-b-[2px] border-gray-300" role="tablist">
	{#each tabs as tab (tab.id)}
		<button
			class="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-bold uppercase tracking-wide transition-colors relative {activeTab ===
			tab.id
				? tabActiveClass
				: tabInactiveClass}"
			on:click={() => selectTab(tab.id)}
			role="tab"
			aria-selected={activeTab === tab.id}
		>
			{#if tab.icon}
				<i class="{tab.icon} text-[10px]" />
			{/if}
			{tab.label}
			{#if tab.badge}
				<span
					class="absolute -top-1 -right-1 w-2 h-2 bg-[#ff6b6b] rounded-full border-[1px] border-gray-900 shadow-[1px_1px_0_0_#000]"
				/>
			{/if}
		</button>
	{/each}
</div>
