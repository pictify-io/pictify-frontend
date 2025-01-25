<script>
	import { createEventDispatcher } from 'svelte';
	import PlusIcon from '$lib/assets/dashboard/Plus.svg';
	import { goto } from '$app/navigation';

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
</script>

<div class="p-2">
	<div class="flex items-center justify-between gap-4">
		<div class="flex-grow max-w-md">
			<input
				type="text"
				placeholder="Search templates..."
				class="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-black focus:outline-none transition-colors"
				bind:value={searchQuery}
				on:input={handleSearch}
			/>
		</div>
		<button
			class="bg-black hover:bg-black/80 text-white font-bold py-2 px-4 rounded ring-1 ring-black ring-opacity-5 transition-colors flex items-center gap-2"
			on:click={() => {
				goto('/dashboard/template/create');
			}}
		>
			<img src={PlusIcon} alt="Plus icon" class="w-5 h-5" />
			<span>Create</span>
		</button>
	</div>
</div>
