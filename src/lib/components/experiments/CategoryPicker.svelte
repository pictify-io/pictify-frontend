<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let disabled = false;

	const CATEGORIES = [
		{
			id: 'Device',
			label: 'Device',
			icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
			properties: [
				{ value: 'device.type', label: 'Device Type' },
				{ value: 'device.os', label: 'Operating System' },
			],
		},
		{
			id: 'Location',
			label: 'Location',
			icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
			properties: [
				{ value: 'geo.country', label: 'Country' },
				{ value: 'geo.continent', label: 'Continent' },
			],
		},
		{
			id: 'Time',
			label: 'Time',
			icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
			properties: [
				{ value: 'time.hour', label: 'Hour of Day (UTC)' },
				{ value: 'time.dayOfWeek', label: 'Day of Week' },
			],
		},
		{
			id: 'Browser',
			label: 'Browser',
			icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
			properties: [
				{ value: 'browser.language', label: 'Browser Language' },
			],
		},
		{
			id: 'URL',
			label: 'URL',
			icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
			properties: [
				{ value: 'url.param', label: 'URL Parameter' },
			],
		},
		{
			id: 'Referrer',
			label: 'Referrer',
			icon: 'M10 19l-7-7m0 0l7-7m-7 7h18',
			properties: [
				{ value: 'referrer.domain', label: 'Referrer Domain' },
			],
		},
	];

	let selectedCategory = null;
	let step = 'category'; // 'category' | 'property'

	function selectCategory(cat) {
		// If category has only one property, skip to select it directly
		if (cat.properties.length === 1) {
			dispatch('select', cat.properties[0].value);
			reset();
			return;
		}
		selectedCategory = cat;
		step = 'property';
	}

	function selectProperty(propertyValue) {
		dispatch('select', propertyValue);
		reset();
	}

	function reset() {
		selectedCategory = null;
		step = 'category';
	}

	function cancel() {
		reset();
		dispatch('cancel');
	}
</script>

<!-- Full screen overlay with blur -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/20">
	<!-- Clickable backdrop to close -->
	<div 
		class="absolute inset-0" 
		on:click={cancel}
		on:keydown={(e) => e.key === 'Escape' && cancel()}
		role="button"
		tabindex="0"
		aria-label="Close category picker"
	></div>

	<!-- Modal container -->
	<div class="relative w-full max-w-2xl border-[3px] border-black rounded-2xl bg-[#FFFDF8] shadow-[12px_12px_0_0_black] overflow-hidden">
	{#if step === 'category'}
		<!-- Step 1: Category grid -->
		<div class="px-5 py-4 bg-[#FFDE82] border-b-[3px] border-black flex items-center justify-between">
			<span class="text-xs font-black uppercase tracking-widest text-black/80">Choose a category</span>
			<button
				type="button"
				on:click={cancel}
				{disabled}
				class="p-1.5 border-[3px] border-transparent rounded-lg text-black hover:bg-white hover:border-black hover:shadow-[2px_2px_0_0_black] transition-all"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		<div class="p-5 grid grid-cols-3 gap-4">
			{#each CATEGORIES as cat}
				<button
					type="button"
					on:click={() => selectCategory(cat)}
					{disabled}
					class="flex flex-col items-center gap-3 p-5 rounded-xl border-[3px] border-gray-200 bg-white
						hover:border-black hover:bg-[#FFDE82] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px]
						active:translate-y-0 active:shadow-none
						transition-all text-center group cursor-pointer"
				>
					<div class="w-12 h-12 border-[3px] border-transparent rounded-xl bg-gray-100 group-hover:bg-white group-hover:border-black group-hover:shadow-[2px_2px_0_0_black] flex items-center justify-center transition-all">
						<svg class="w-6 h-6 text-gray-500 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d={cat.icon} />
						</svg>
					</div>
					<span class="text-[10px] font-black uppercase tracking-widest text-gray-700 group-hover:text-black">{cat.label}</span>
				</button>
			{/each}
		</div>

	{:else if step === 'property'}
		<!-- Step 2: Property pills -->
		<div class="px-5 py-4 bg-[#c4f0ff] border-b-[3px] border-black flex items-center justify-between">
			<div class="flex items-center gap-2">
				<button
					type="button"
					on:click={reset}
					{disabled}
					class="p-1.5 border-[3px] border-transparent rounded-lg text-black hover:bg-white hover:border-black hover:shadow-[2px_2px_0_0_black] transition-all"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<span class="text-xs font-black uppercase tracking-widest text-black/80">{selectedCategory?.label} properties</span>
			</div>
			<button
				type="button"
				on:click={cancel}
				{disabled}
				class="p-1.5 border-[3px] border-transparent rounded-lg text-black hover:bg-white hover:border-black hover:shadow-[2px_2px_0_0_black] transition-all"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		<div class="p-6 flex flex-wrap gap-3">
			{#each selectedCategory?.properties || [] as prop}
				<button
					type="button"
					on:click={() => selectProperty(prop.value)}
					{disabled}
					class="px-5 py-3 rounded-xl border-[3px] border-gray-300 bg-white text-sm font-bold text-gray-700
						hover:border-black hover:bg-[#c4f0ff] hover:shadow-[4px_4px_0_0_black] hover:-translate-y-[2px] hover:text-black
						active:translate-y-0 active:shadow-none
						transition-all cursor-pointer"
				>
					{prop.label}
				</button>
			{/each}
		</div>
	{/if}
	</div>
</div>
