<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function toggleSidebar() {
		dispatch('toggleSidebar');
	}
</script>

<header
	class="w-full h-20 z-30 border-b-[3px] border-black flex justify-between relative items-stretch md:divide-x-[3px] divide-black"
>
	<div class="flex items-center">
		<button
			class="md:hidden px-4 h-full flex items-center justify-center border-r-[3px] border-black hover:bg-gray-100"
			on:click={toggleSidebar}
		>
			<svg
				class="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		</button>
		<a
			href="/"
			class="flex flex-shrink-0 text-black items-center justify-center h-full p-5 no-underline cursor-pointer"
		>
			<span class="text-2xl font-bold font-heading text-shadow">Pictify </span>&nbsp;
		</a>
	</div>
</header>
