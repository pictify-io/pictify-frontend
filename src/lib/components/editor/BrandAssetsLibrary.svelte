<script>
	import { onMount } from 'svelte';
	import { editor } from '../../../store/editor.store';
	import { toast } from '../../../store/toast.store';
	import { FabricImage } from 'fabric';
	import { getBrandAssets } from '../../../api/brand-assets';
	import Loader from '../Loader.svelte';

	let loading = true;
	let assets = [];
	let selectedType = null;
	let counts = {};
	let searchQuery = '';

	const ASSET_TYPES = [
		{ key: null, label: 'ALL', icon: `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 6h16M4 12h16M4 18h16"/></svg>` },
		{ key: 'logo', label: 'LOGOS', icon: `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>` },
		{ key: 'color', label: 'COLORS', icon: `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>` },
		{ key: 'font', label: 'TYPE', icon: `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 6h16M4 12h16m-7 6h7"/></svg>` },
		{ key: 'image', label: 'IMGS', icon: `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>` },
		{ key: 'icon', label: 'ICONS', icon: `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/></svg>` },
	];

	$: filteredAssets = assets.filter(asset => {
		if (selectedType && asset.type !== selectedType) return false;
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			return asset.name.toLowerCase().includes(query) ||
				asset.tags?.some(t => t.toLowerCase().includes(query));
		}
		return true;
	});

	// Separate by type for the "All" view
	$: groupedAssets = {
		logo: filteredAssets.filter(a => a.type === 'logo'),
		image: filteredAssets.filter(a => a.type === 'image'),
		icon: filteredAssets.filter(a => a.type === 'icon'),
		color: filteredAssets.filter(a => a.type === 'color'),
		font: filteredAssets.filter(a => a.type === 'font'),
	};

	async function loadAssets() {
		loading = true;
		try {
			const response = await getBrandAssets({ limit: 100 });
			assets = response.assets || [];
			counts = response.counts || {};
		} catch (error) {
			console.error('Error loading brand assets:', error);
			toast.set({ message: 'Failed to load brand assets', type: 'error', duration: 2000 });
		} finally {
			loading = false;
		}
	}

	async function addImageToCanvas(asset) {
		if (!$editor) return;

		try {
			const img = await FabricImage.fromURL(asset.url, { crossOrigin: 'anonymous' });
			
			const center = $editor.getCenter();
			img.set({
				left: center.left,
				top: center.top,
				originX: 'center',
				originY: 'center',
				name: asset.name,
				brandAssetUid: asset.uid,
				brandAssetType: asset.type
			});
			
			// Scale down if too big
			const maxSize = Math.min($editor.width, $editor.height) * 0.6;
			if (img.width > maxSize) {
				img.scaleToWidth(maxSize);
			}
			if (img.getScaledHeight() > maxSize) {
				img.scaleToHeight(maxSize);
			}
			
			$editor.add(img);
			$editor.setActiveObject(img);
			$editor.renderAll();
			
			toast.set({ message: `${asset.name} added to canvas`, type: 'success', duration: 2000 });
		} catch (error) {
			console.error('Error adding image to canvas:', error);
			toast.set({ message: 'Failed to add image', type: 'error', duration: 2000 });
		}
	}

	function applyColorToSelected(color) {
		if (!$editor) return;
		
		const activeObject = $editor.getActiveObject();
		if (!activeObject) {
			toast.set({ message: 'Select an object first', type: 'warning', duration: 2000 });
			return;
		}

		if (activeObject.type === 'i-text' || activeObject.type === 'text' || activeObject.type === 'textbox') {
			activeObject.set('fill', color);
		} else {
			activeObject.set('fill', color);
		}
		
		$editor.renderAll();
		toast.set({ message: `Applied ${color}`, type: 'success', duration: 2000 });
	}

	function copyColor(color) {
		navigator.clipboard.writeText(color).then(() => {
			toast.set({ message: 'Color copied!', type: 'success', duration: 2000 });
		});
	}

	function applyFontToSelected(fontFamily) {
		if (!$editor) return;
		
		const activeObject = $editor.getActiveObject();
		if (!activeObject) {
			toast.set({ message: 'Select a text object first', type: 'warning', duration: 2000 });
			return;
		}

		if (activeObject.type !== 'i-text' && activeObject.type !== 'text' && activeObject.type !== 'textbox') {
			toast.set({ message: 'Please select a text object', type: 'warning', duration: 2000 });
			return;
		}

		activeObject.set('fontFamily', fontFamily);
		$editor.renderAll();
		toast.set({ message: `Applied ${fontFamily}`, type: 'success', duration: 2000 });
	}

	onMount(() => {
		loadAssets();
	});
</script>

<div class="h-full flex flex-col bg-[#FFFDF8]">
	<!-- Search & Filters -->
	<div class="bg-white border-b-[3px] border-gray-900 p-4 space-y-4 shrink-0 shadow-sm relative z-20">
		<!-- Search Input -->
		<div class="relative">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
			</div>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="SEARCH INVENTORY..."
				class="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-[2px] border-gray-900 text-xs font-bold uppercase tracking-wide focus:outline-none focus:bg-white focus:shadow-[3px_3px_0_0_#1f2937] transition-all placeholder-gray-400 rounded-none"
			/>
		</div>

		<!-- Type Filters -->
		<div class="flex flex-wrap gap-2">
			{#each ASSET_TYPES as type}
				<button
					on:click={() => selectedType = type.key}
					class="flex-1 min-w-[70px] py-2 px-1 text-[9px] font-black uppercase border-[2px] border-gray-900 transition-all flex items-center justify-center gap-1.5
					{selectedType === type.key 
						? 'bg-[#ffc480] text-gray-900 shadow-[2px_2px_0_0_#1f2937] -translate-y-0.5' 
						: 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:shadow-[2px_2px_0_0_rgba(31,41,55,0.1)]'}"
				>
					{@html type.icon}
					<span class="hidden sm:inline">{type.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto p-4 bg-[#FFFDF8] relative scrollbar-thin scrollbar-thumb-gray-900 scrollbar-track-transparent">
		<!-- Background Grid -->
		<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50 pointer-events-none"></div>
		
		<div class="relative z-10">
			{#if loading}
				<div class="flex flex-col items-center justify-center py-12">
					<Loader size="8" show={loading} />
					<p class="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4 animate-pulse">Syncing Database...</p>
				</div>
			{:else if assets.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-center py-10 px-4">
					<div class="w-16 h-16 bg-gray-100 border-[3px] border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#1f2937] rotate-3">
						<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
					</div>
					<p class="text-gray-900 font-black text-sm uppercase tracking-wide mb-1">Inventory Empty</p>
					<p class="text-gray-500 text-xs mb-6 max-w-[200px]">Upload assets to populate your design library.</p>
					<a
						href="/dashboard/brand-assets"
						target="_blank"
						class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white border-[2px] border-gray-900 text-xs font-bold uppercase hover:bg-[#ffc480] hover:text-gray-900 transition-all hover:shadow-[3px_3px_0_0_#1f2937] hover:-translate-y-0.5"
					>
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
						Upload Assets
					</a>
				</div>
			{:else if filteredAssets.length === 0}
				<div class="text-center py-12 bg-white/50 border-[2px] border-dashed border-gray-300">
					<p class="text-gray-400 text-xs font-bold uppercase tracking-widest">No matching assets found</p>
				</div>
			{:else}
				<!-- Show grouped when "All" is selected -->
				{#if selectedType === null}
					<!-- Logos Section -->
					{#if groupedAssets.logo.length > 0}
						<div class="mb-8">
							<h3 class="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
								<span class="w-1 h-1 bg-gray-900 rounded-full"></span>
								Logos
							</h3>
							<div class="grid grid-cols-2 gap-3">
								{#each groupedAssets.logo as asset}
									<button
										on:click={() => addImageToCanvas(asset)}
										class="group relative aspect-square bg-white border-[2px] border-gray-900 p-3 hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all flex items-center justify-center overflow-hidden"
										title={asset.name}
									>
										<div class="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"></div>
										<img 
											src={asset.url} 
											alt={asset.name}
											class="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
										/>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Colors Section -->
					{#if groupedAssets.color.length > 0}
						<div class="mb-8">
							<h3 class="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
								<span class="w-1 h-1 bg-gray-900 rounded-full"></span>
								Palette
							</h3>
							<div class="grid grid-cols-4 gap-2">
								{#each groupedAssets.color as asset}
									<div class="group relative">
										<button
											on:click={() => applyColorToSelected(asset.value)}
											class="w-full aspect-square border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
											style="background-color: {asset.value}"
											title="{asset.name} - Click to apply"
										></button>
										<!-- Copy Action -->
										<button
											on:click|stopPropagation={() => copyColor(asset.value)}
											class="absolute -top-2 -right-2 w-5 h-5 bg-white border-[2px] border-gray-900 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-10"
											title="Copy color code"
										>
											<svg class="w-2.5 h-2.5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Fonts Section -->
					{#if groupedAssets.font.length > 0}
						<div class="mb-8">
							<h3 class="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
								<span class="w-1 h-1 bg-gray-900 rounded-full"></span>
								Typeface
							</h3>
							<div class="space-y-2">
								{#each groupedAssets.font as asset}
									<button
										on:click={() => applyFontToSelected(asset.metadata?.fontFamily || asset.name)}
										class="w-full p-3 bg-white border-[2px] border-gray-900 text-left hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all group relative overflow-hidden"
									>
										<span 
											class="text-xl text-gray-900 block mb-1 relative z-10"
											style="font-family: '{asset.metadata?.fontFamily || asset.name}'"
										>
											Aa
										</span>
										<span class="text-[9px] font-mono font-bold text-gray-400 uppercase group-hover:text-[#ff6b6b] transition-colors relative z-10">
											{asset.metadata?.fontFamily || asset.name}
										</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Images & Icons -->
					{#if groupedAssets.image.length > 0 || groupedAssets.icon.length > 0}
						<div class="mb-8">
							<h3 class="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
								<span class="w-1 h-1 bg-gray-900 rounded-full"></span>
								Media Assets
							</h3>
							<div class="grid grid-cols-2 gap-3">
								{#each [...groupedAssets.image, ...groupedAssets.icon] as asset}
									<button
										on:click={() => addImageToCanvas(asset)}
										class="group bg-white border-[2px] border-gray-900 p-2 hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all"
										title={asset.name}
									>
										<div class="aspect-video bg-gray-50 border border-gray-100 overflow-hidden relative flex items-center justify-center">
											<div class="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]"></div>
											<img 
												src={asset.url} 
												alt={asset.name}
												class="w-full h-full object-contain p-2"
											/>
										</div>
										<div class="mt-2 text-[9px] font-bold text-gray-500 truncate text-center group-hover:text-gray-900 uppercase tracking-wide">
											{asset.name}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				{:else}
					<!-- Single type view (Grid Layouts) -->
					<div class="grid {selectedType === 'color' || selectedType === 'icon' ? 'grid-cols-3' : 'grid-cols-2'} gap-3">
						{#each filteredAssets as asset}
							{#if selectedType === 'font'}
								<button
									on:click={() => applyFontToSelected(asset.metadata?.fontFamily || asset.name)}
									class="col-span-2 w-full p-3 bg-white border-[2px] border-gray-900 text-left hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all group"
								>
									<span 
										class="text-lg text-gray-900 block"
										style="font-family: '{asset.metadata?.fontFamily || asset.name}'"
									>
										Quick Brown Fox
									</span>
									<span class="text-[9px] font-mono text-gray-400 mt-1 block uppercase group-hover:text-[#ff6b6b]">{asset.metadata?.fontFamily || asset.name}</span>
								</button>
							{:else if selectedType === 'color'}
								<button
									on:click={() => applyColorToSelected(asset.value)}
									class="w-full aspect-square border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all relative"
									style="background-color: {asset.value}"
									title="Click to apply"
								>
									<div class="absolute bottom-0 left-0 right-0 bg-white/90 text-[8px] font-mono font-bold py-0.5 text-center border-t border-gray-900 opacity-0 hover:opacity-100">
										{asset.value}
									</div>
								</button>
							{:else}
								<button
									on:click={() => addImageToCanvas(asset)}
									class="bg-white border-[2px] border-gray-900 p-2 hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 transition-all"
								>
									<div class="aspect-square flex items-center justify-center bg-gray-50 border border-gray-100 relative overflow-hidden">
										<div class="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:4px_4px]"></div>
										<img 
											src={asset.url} 
											alt={asset.name}
											class="w-full h-full object-contain p-2"
										/>
									</div>
								</button>
							{/if}
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Footer Action -->
	<div class="p-3 border-t-[3px] border-gray-900 bg-gray-50 shrink-0">
		<a
			href="/dashboard/brand-assets"
			target="_blank"
			class="flex items-center justify-center gap-2 w-full py-3 text-xs font-black text-white bg-gray-900 border-[2px] border-gray-900 shadow-[3px_3px_0_0_#ffc480] hover:shadow-[1px_1px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-widest"
		>
			<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
			Manage Inventory
		</a>
	</div>
</div>