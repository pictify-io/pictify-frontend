<script>
	export let options = [];

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let isDropdownOpen = false;

	const toggleDropdown = () => {
		isDropdownOpen = !isDropdownOpen;
	};

	let selectedValue = null;

	const selectOption = (option) => {
		selectedValue = option;
		dispatch('select', option);
		toggleDropdown();
	};
</script>

<div class="relative inline-block text-left">
	<div>
		<button
			type="button"
			class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
			id="menu-button"
			aria-expanded="true"
			aria-haspopup="true"
			on:click={toggleDropdown}
		>
			Options
			<svg
				class="-mr-1 h-5 w-5 text-gray-400"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	</div>

	{#if isDropdownOpen && options.length > 0}
		<div
			class="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
			role="menu"
			aria-orientation="vertical"
			aria-labelledby="menu-button"
			tabindex="-1"
		>
			{#each options as option}
				<div class="py-1" role="none">
					<a
						href="#"
						class="text-gray-700 block px-4 py-2 text-sm"
						role="menuitem"
						tabindex="-1"
						on:click={selectOption(option.value)}>{option.label}</a
					>
				</div>
			{/each}
		</div>
	{/if}
</div>
