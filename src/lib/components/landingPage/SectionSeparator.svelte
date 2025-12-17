<script>
	export let icon = 'arrow'; // 'arrow', 'star', 'bolt', 'hash'
</script>

<div class="w-full flex items-center justify-center relative h-0 z-20 overflow-visible">
	<!-- The Line -->
	<div class="absolute w-full h-[3px] bg-gray-900 top-1/2 -translate-y-1/2"></div>
	
	<!-- The Joint Badge -->
	<div class="relative bg-[#FFFDF8] border-[3px] border-gray-900 px-6 py-2 flex items-center justify-center gap-2 transform hover:scale-110 transition-transform duration-200 origin-center">
		<!-- Corner Bolts -->
		<div class="w-1.5 h-1.5 bg-gray-900 absolute top-1.5 left-1.5 rounded-full"></div>
		<div class="w-1.5 h-1.5 bg-gray-900 absolute top-1.5 right-1.5 rounded-full"></div>
		<div class="w-1.5 h-1.5 bg-gray-900 absolute bottom-1.5 left-1.5 rounded-full"></div>
		<div class="w-1.5 h-1.5 bg-gray-900 absolute bottom-1.5 right-1.5 rounded-full"></div>

		<!-- Icon Content -->
		{#if icon === 'arrow'}
			<svg class="w-5 h-5 text-gray-900 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
		{:else if icon === 'star'}
			<svg class="w-5 h-5 text-[#ffc480]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
		{:else if icon === 'bolt'}
			<svg class="w-5 h-5 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 24 24"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34 4.86-9.22 4.86-9.22C12.14 3.96 12.32 4 12.5 4c.55 0 1 .45 1 1v6h3.5c.58 0 .57.32.38.66-.19.34-4.86 9.22-4.86 9.22-.14.24-.32.2-.5.2z"/></svg>
		{:else if icon === 'hash'}
			<span class="font-mono font-black text-lg text-gray-400">#</span>
		{/if}
	</div>
</div>
