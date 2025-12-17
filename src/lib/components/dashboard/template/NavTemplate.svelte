<script>
	import { createEventDispatcher } from 'svelte';
	import PlusIcon from '$lib/assets/dashboard/Plus.svg';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();
	let searchTimeout;
	let searchQuery = '';

	const handleSearch = (event) => {
		const query = event.target.value;
		searchQuery = query;
		
		// Debounce search
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			dispatch('search', query);
		}, 300);
	};

	const openTemplateCreator = () => {
		const url = '/template-workspace/create';
		if (browser) {
			window.open(url, '_blank', 'noopener,noreferrer');
		} else {
			goto(url);
		}
	};
</script>

<div class="py-2">
	<div class="flex items-center justify-between gap-4">
		<div class="flex-grow max-w-md">
			<div class="relative">
				<svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
				</svg>
			<input
				type="text"
				placeholder="Search templates..."
					class="w-full pl-12 pr-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl font-medium focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_0_#ffc480] transition-all duration-200"
				bind:value={searchQuery}
				on:input={handleSearch}
			/>
			</div>
		</div>
		<button
			class="bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold py-3 px-5 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 flex items-center gap-2"
			on:click={openTemplateCreator}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
			</svg>
			<span>Create</span>
		</button>
	</div>
</div>
