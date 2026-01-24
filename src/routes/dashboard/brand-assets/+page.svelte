<script>
	import { onMount, onDestroy } from 'svelte';
	import { 
		brandAssets, 
		fetchBrandAssets, 
		uploadAsset, 
		addColor, 
		deleteAsset,
		deleteAssets 
	} from '../../../store/brand-assets.store';
	import { toast } from '../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { ASSET_TYPE_LABELS, ASSET_TYPE_ICONS, COLOR_CATEGORIES, getAcceptString } from '../../../api/brand-assets';
	import { user } from '../../../store/user.store';

	let isLoading = true;
	let isUploading = false;
	let selectedType = null;
	let selectedAssets = new Set();
	let showDeleteConfirm = false;
	let assetToDelete = null;
	let showColorModal = false;
	let showUploadModal = false;
	let uploadType = 'image';
	let currentPlan = '';
	let unsubscribeUser = () => {};

	// Color form
	let colorForm = {
		name: '',
		value: '#000000',
		category: 'primary',
		description: ''
	};

	// Upload form
	let uploadForm = {
		name: '',
		description: '',
		tags: '',
		isPrimary: false
	};
	let selectedFile = null;

	let fileInput;

	$: assets = $brandAssets.assets;
	$: counts = $brandAssets.counts;
	$: limits = $brandAssets.limits;
	$: pagination = $brandAssets.pagination;

	const ASSET_TYPES = ['logo', 'font', 'color', 'image', 'icon'];

	async function loadAssets(type = null) {
		isLoading = true;
		selectedType = type;
		try {
			await fetchBrandAssets({ type });
		} finally {
			isLoading = false;
		}
	}

	function openUploadModal(type = 'image') {
		uploadType = type;
		uploadForm = { name: '', description: '', tags: '', isPrimary: false };
		selectedFile = null;
		showUploadModal = true;
	}

	function closeUploadModal() {
		showUploadModal = false;
		selectedFile = null;
	}

	function handleFileSelect(event) {
		const file = event.target.files?.[0];
		if (file) {
			selectedFile = file;
			if (!uploadForm.name) {
				uploadForm.name = file.name.replace(/\.[^/.]+$/, '');
			}
		}
	}

	async function handleUpload() {
		if (!selectedFile) {
			toast.set({ message: 'Please select a file', type: 'error' });
			return;
		}

		isUploading = true;
		try {
			const tags = uploadForm.tags
				? uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean)
				: [];

			await uploadAsset(selectedFile, {
				type: uploadType,
				name: uploadForm.name || selectedFile.name,
				description: uploadForm.description,
				tags,
				isPrimary: uploadForm.isPrimary
			});

			toast.set({ message: `${ASSET_TYPE_LABELS[uploadType]} uploaded successfully!`, type: 'success', duration: 3000 });
			closeUploadModal();
		} catch (error) {
			toast.set({ message: error.message || 'Upload failed', type: 'error' });
		} finally {
			isUploading = false;
		}
	}

	function openColorModal() {
		colorForm = { name: '', value: '#000000', category: 'primary', description: '' };
		showColorModal = true;
	}

	function closeColorModal() {
		showColorModal = false;
	}

	async function handleAddColor() {
		if (!colorForm.name || !colorForm.value) {
			toast.set({ message: 'Please fill in color name and value', type: 'error' });
			return;
		}

		isUploading = true;
		try {
			await addColor(colorForm);
			toast.set({ message: 'Color added successfully!', type: 'success', duration: 3000 });
			closeColorModal();
		} catch (error) {
			toast.set({ message: error.message || 'Failed to add color', type: 'error' });
		} finally {
			isUploading = false;
		}
	}

	function confirmDelete(asset) {
		assetToDelete = asset;
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		assetToDelete = null;
	}

	async function handleDelete() {
		if (!assetToDelete) return;

		try {
			await deleteAsset(assetToDelete.uid);
			toast.set({ message: 'Asset deleted successfully', type: 'success', duration: 3000 });
			closeDeleteConfirm();
		} catch (error) {
			toast.set({ message: error.message || 'Delete failed', type: 'error' });
		}
	}

	function toggleSelectAsset(uid) {
		if (selectedAssets.has(uid)) {
			selectedAssets.delete(uid);
		} else {
			selectedAssets.add(uid);
		}
		selectedAssets = selectedAssets;
	}

	function selectAll() {
		if (selectedAssets.size === assets.length) {
			selectedAssets.clear();
		} else {
			selectedAssets = new Set(assets.map(a => a.uid));
		}
		selectedAssets = selectedAssets;
	}

	async function handleBulkDelete() {
		if (selectedAssets.size === 0) return;

		try {
			await deleteAssets(Array.from(selectedAssets));
			toast.set({ message: `${selectedAssets.size} assets deleted`, type: 'success', duration: 3000 });
			selectedAssets.clear();
			selectedAssets = selectedAssets;
		} catch (error) {
			toast.set({ message: error.message || 'Delete failed', type: 'error' });
		}
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard!', type: 'success', duration: 2000 });
		});
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	onMount(async () => {
		unsubscribeUser = user.subscribe(u => {
			if (u) currentPlan = u.currentPlan;
		});
		await loadAssets();
	});

	onDestroy(() => {
		unsubscribeUser();
	});
</script>

<section class="min-h-full">
	<div>
		<!-- Page Header -->
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
			<div>
				<div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3">
					<span class="w-2 h-2 bg-[#ff6b6b] rounded-full animate-pulse"></span>
					Asset Vault
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					Brand <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Assets</span>
				</h1>
			</div>
			
			<!-- Stats / Plan -->
			<div class="flex items-center gap-4 sm:gap-6 md:gap-8">
				<div class="text-right">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Total Assets</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 tabular-nums">{pagination.total || 0}</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6 md:pl-8">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Current Plan</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">{currentPlan || 'Starter'}</div>
				</div>
			</div>
		</div>

		<!-- Filter Tabs and Actions -->
		<div class="flex flex-wrap gap-2 mb-6 sm:mb-8">
			<button
				on:click={() => loadAssets(null)}
				class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[2px] border-gray-900 transition-all
				{selectedType === null
					? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#1f2937]'
					: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-[2px_2px_0_0_#1f2937]'}"
			>
				All
			</button>
			{#each ASSET_TYPES as type}
				<button
					on:click={() => loadAssets(type)}
					class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[2px] border-gray-900 transition-all flex items-center gap-2
					{selectedType === type
						? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#1f2937]'
						: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-[2px_2px_0_0_#1f2937]'}"
				>
					{ASSET_TYPE_LABELS[type]}s
					<span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold ml-1">
						{counts[type] || 0}
					</span>
				</button>
			{/each}

			<div class="flex-grow"></div>

			<button
				on:click={() => openUploadModal('logo')}
				class="px-4 py-2.5 bg-[#ffc480] text-gray-900 text-xs font-black uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
				Logo
			</button>
			<button
				on:click={openColorModal}
				class="px-4 py-2.5 bg-[#4ade80] text-gray-900 text-xs font-black uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
				Color
			</button>
			<button
				on:click={() => openUploadModal('font')}
				class="px-4 py-2.5 bg-white text-gray-900 text-xs font-black uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
				Font
			</button>
			<button
				on:click={() => openUploadModal('image')}
				class="px-4 py-2.5 bg-white text-gray-900 text-xs font-black uppercase tracking-wide rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				Image
			</button>
		</div>

		<!-- Bulk Actions (Conditional) -->
		{#if selectedAssets.size > 0}
			<div class="bg-[#ff6b6b] text-white rounded-xl border-[3px] border-gray-900 p-4 mb-8 flex items-center justify-between shadow-[4px_4px_0_0_#1f2937] animate-fade-in">
				<div class="flex items-center gap-3">
					<button
						on:click={selectAll}
						class="w-6 h-6 rounded-md border-2 border-white bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
					>
						{#if selectedAssets.size === assets.length}
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
						{/if}
					</button>
					<span class="font-black uppercase tracking-wide text-sm">{selectedAssets.size} assets selected</span>
				</div>
				<button
					on:click={handleBulkDelete}
					class="px-4 py-2 bg-white text-[#ff6b6b] rounded-lg border-[2px] border-gray-900 text-xs font-black uppercase tracking-wide hover:shadow-[2px_2px_0_0_#1f2937] hover:-translate-y-0.5 transition-all flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
					Delete Selected
				</button>
			</div>
		{/if}

		<!-- Content Grid -->
		<div class="relative min-h-[400px]">
			{#if isLoading}
				<div class="absolute inset-0 flex items-center justify-center z-20 bg-[#FFFDF8]/80 backdrop-blur-sm">
					<Loader size="16" show={isLoading} />
				</div>
			{/if}

			{#if assets.length === 0 && !isLoading}
				<div class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-[3px] border-gray-900 border-dashed shadow-sm">
					<div class="w-24 h-24 bg-gray-100 rounded-full border-[3px] border-gray-900 flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#1f2937]">
						<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
					</div>
					<h3 class="text-2xl font-black text-gray-900 uppercase tracking-wide mb-2">
						{#if selectedType}
							No {ASSET_TYPE_LABELS[selectedType]}s Found
						{:else}
							Asset Vault Empty
						{/if}
					</h3>
					<p class="text-gray-500 font-bold max-w-md text-center mb-8">
						Upload your brand assets to create a consistent design system across all your templates.
					</p>
					<button
						on:click={() => selectedType ? (selectedType === 'color' ? openColorModal() : openUploadModal(selectedType)) : openUploadModal('logo')}
						class="px-8 py-4 bg-gray-900 text-white text-sm font-black rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider"
					>
						Upload First Asset
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
					{#each assets as asset (asset.uid)}
						<div class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[6px_6px_0_0_#1f2937] hover:shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-all duration-200 relative">
							<!-- Selection Checkbox -->
							<button
								on:click|stopPropagation={() => toggleSelectAsset(asset.uid)}
								class="absolute top-3 left-3 z-20 w-6 h-6 rounded bg-white border-[2px] border-gray-900 flex items-center justify-center shadow-sm hover:scale-110 transition-transform
								{selectedAssets.has(asset.uid) ? 'bg-gray-900' : 'opacity-0 group-hover:opacity-100'}"
							>
								{#if selectedAssets.has(asset.uid)}
									<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
								{/if}
							</button>

							<!-- Asset Preview -->
							<div class="relative aspect-square bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center overflow-hidden border-b-[3px] border-gray-900 group-hover:bg-gray-50 transition-colors">
								{#if asset.type === 'color'}
									<div class="w-full h-full" style="background-color: {asset.value}"></div>
									<div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg border-[2px] border-gray-900 text-xs font-mono font-black text-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
										{asset.value}
									</div>
								{:else if asset.type === 'font'}
									<div class="text-center w-full px-4">
										<span class="text-5xl text-gray-900 block mb-2" style="font-family: '{asset.metadata?.fontFamily || asset.name}'">Aa</span>
										<span class="text-[10px] font-mono font-bold text-gray-400 uppercase truncate block">{asset.metadata?.fontFamily || asset.name}</span>
									</div>
								{:else}
									<img 
										src={asset.url} 
										alt={asset.name}
										class="w-full h-full object-contain p-6 drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
										loading="lazy"
									/>
								{/if}

								<!-- Type Badge -->
								<div class="absolute top-3 right-3">
									<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white text-gray-900 border-[2px] border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
										{asset.type}
									</span>
								</div>

								<!-- Hover Overlay -->
								<div class="absolute inset-0 bg-gray-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
								
								<!-- Action Buttons (visible on hover) -->
								<div class="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
									<button
										on:click|stopPropagation={() => copyToClipboard(asset.type === 'color' ? asset.value : asset.url)}
										class="w-8 h-8 bg-white rounded-lg border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center justify-center hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
										title="Copy"
									>
										<svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
									</button>
									<button
										on:click|stopPropagation={() => confirmDelete(asset)}
										class="w-8 h-8 bg-[#ff6b6b] rounded-lg border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center justify-center hover:bg-[#ff5252] hover:-translate-y-0.5 transition-all"
										title="Delete"
									>
										<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
									</button>
								</div>
							</div>

							<!-- Card Footer -->
							<div class="p-4 bg-white">
								<h3 class="font-black text-gray-900 text-xs uppercase tracking-wide truncate mb-1" title={asset.name}>
									{asset.name}
								</h3>
								<div class="flex items-center justify-between">
									<span class="text-[10px] font-bold text-gray-400 uppercase">{formatDate(asset.createdAt)}</span>
									{#if asset.isPrimary}
										<span class="w-2 h-2 rounded-full bg-[#ff6b6b] border border-gray-900" title="Primary Asset"></span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Modals share the same design language -->
{#if showUploadModal}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
	<div 
		class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		on:click={closeUploadModal}
		role="dialog"
		aria-modal="true"
		aria-labelledby="upload-modal-title"
	>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div 
			class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#000] max-w-md w-full overflow-hidden"
			on:click|stopPropagation
		>
			<div class="bg-gray-900 p-4 flex items-center justify-between">
				<h2 id="upload-modal-title" class="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
					<span class="text-[#ffc480]">Upload</span> {ASSET_TYPE_LABELS[uploadType]}
				</h2>
				<button on:click={closeUploadModal} class="text-gray-400 hover:text-white">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="p-6 space-y-5">
				<!-- File Drop Zone -->
				<label class="block group cursor-pointer">
					<input
						type="file"
						accept={getAcceptString(uploadType)}
						class="hidden"
						bind:this={fileInput}
						on:change={handleFileSelect}
					/>
					<div 
						class="w-full py-10 border-[3px] border-dashed rounded-xl transition-all relative overflow-hidden
							{selectedFile ? 'border-[#4ade80] bg-[#4ade80]/10' : 'border-gray-300 group-hover:border-gray-900 group-hover:bg-gray-50'}"
					>
						<div class="text-center relative z-10">
							{#if selectedFile}
								<div class="w-12 h-12 bg-[#4ade80] rounded-full border-[3px] border-gray-900 flex items-center justify-center mx-auto mb-3 shadow-sm">
									<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
								</div>
								<p class="font-black text-gray-900 text-sm uppercase tracking-wide">{selectedFile.name}</p>
								<p class="text-xs font-bold text-gray-500 mt-1 uppercase">Click to replace</p>
							{:else}
								<div class="w-12 h-12 bg-white rounded-full border-[3px] border-gray-900 flex items-center justify-center mx-auto mb-3 shadow-[3px_3px_0_0_rgba(0,0,0,0.1)] group-hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] group-hover:-translate-y-0.5 transition-all">
									<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
								</div>
								<p class="font-black text-gray-900 text-sm uppercase tracking-wide">Drop file or click</p>
								<p class="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
									{#if uploadType === 'font'}
										TTF, OTF, WOFF, WOFF2, EOT (Max 5MB)
									{:else}
										PNG, JPG, SVG (Max 10MB)
									{/if}
								</p>
							{/if}
						</div>
					</div>
				</label>

				<!-- Inputs -->
				<div class="space-y-4">
					<div>
						<label for="upload-name" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Asset Name</label>
						<input
							id="upload-name"
							type="text"
							bind:value={uploadForm.name}
							placeholder="e.g., Dark Logo Variant"
							class="w-full px-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="upload-tags" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Tags</label>
							<input
								id="upload-tags"
								type="text"
								bind:value={uploadForm.tags}
								placeholder="logo, dark, brand"
								class="w-full px-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all"
							/>
						</div>
						<div class="flex items-end">
							<label class="flex items-center gap-3 cursor-pointer w-full p-3 bg-white border-[3px] border-gray-900 rounded-xl hover:bg-gray-50 transition-colors">
								<input
									type="checkbox"
									bind:checked={uploadForm.isPrimary}
									class="w-5 h-5 rounded border-[2px] border-gray-900 text-gray-900 focus:ring-0 checked:bg-gray-900"
								/>
								<span class="text-xs font-black text-gray-900 uppercase tracking-wide">Primary Asset</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-3 pt-2">
					<button
						on:click={closeUploadModal}
						class="flex-1 px-4 py-3 bg-white border-[3px] border-gray-900 text-gray-900 rounded-xl font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Cancel
					</button>
					<button
						on:click={handleUpload}
						disabled={!selectedFile || isUploading}
						class="flex-[2] px-4 py-3 bg-[#ff6b6b] text-white rounded-xl font-black uppercase tracking-wide border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isUploading}
							Uploading...
						{:else}
							Upload Asset
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Color Modal uses similar styling -->
{#if showColorModal}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
	<div 
		class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		on:click={closeColorModal}
		role="dialog"
		aria-modal="true"
	>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div 
			class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#000] max-w-md w-full overflow-hidden"
			on:click|stopPropagation
		>
			<div class="bg-gray-900 p-4 flex items-center justify-between">
				<h2 class="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
					<span class="text-[#4ade80]">New</span> Color
				</h2>
				<button on:click={closeColorModal} class="text-gray-400 hover:text-white">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<div class="p-6 space-y-6">
				<!-- Color Picker -->
				<div class="flex gap-4">
					<div 
						class="w-24 h-24 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
						style="background-color: {colorForm.value}"
					></div>
					<div class="flex-1 space-y-4">
						<div>
							<label for="color-hex" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Hex Code</label>
							<div class="flex gap-2">
								<div class="relative w-10 h-10 overflow-hidden rounded-lg border-[3px] border-gray-900">
									<input
										type="color"
										bind:value={colorForm.value}
										class="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
									/>
								</div>
								<input
									id="color-hex"
									type="text"
									bind:value={colorForm.value}
									class="flex-1 px-3 py-2 bg-white border-[3px] border-gray-900 rounded-lg font-mono font-bold uppercase focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480]"
								/>
							</div>
						</div>
						<div>
							<label for="color-name" class="block text-xs font-black text-gray-900 uppercase tracking-wide mb-1">Name</label>
							<input
								id="color-name"
								type="text"
								bind:value={colorForm.name}
								placeholder="e.g. Brand Blue"
								class="w-full px-3 py-2 bg-white border-[3px] border-gray-900 rounded-lg font-bold focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480]"
							/>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-3">
					<button
						on:click={closeColorModal}
						class="flex-1 px-4 py-3 bg-white border-[3px] border-gray-900 text-gray-900 rounded-xl font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						Cancel
					</button>
					<button
						on:click={handleAddColor}
						disabled={!colorForm.name || isUploading}
						class="flex-[2] px-4 py-3 bg-[#4ade80] text-gray-900 rounded-xl font-black uppercase tracking-wide border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
					>
						Add Color
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Toast -->
<Toast />