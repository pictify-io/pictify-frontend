<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { user, getPlanDetailsAction } from '../../../store/user.store';
	import { 
		getTemplatesAction, 
		searchTemplatesAction, 
		templates, 
		templatesPagination 
	} from '../../../store/template.store';
	import TemplateList from '$lib/components/dashboard/template/TemplateList.svelte';
	import EmptyTemplate from '$lib/components/dashboard/template/EmptyTemplate.svelte';
	import Loader from '$lib/components/Loader.svelte';

	let unsubscribeTemplates = () => {};
	let unsubscribePagination = () => {};
	let unsubscribeUser = () => {};
	
	let templateList = [];
	let pagination = { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false };
	let isLoading = true;
	let searchQuery = '';
	let searchTimeout;
	let currentPlan = '';

	// Search Logic
	const handleSearchInput = (event) => {
		const query = event.target.value;
		searchQuery = query;
		
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			isLoading = true;
			if (query) {
				await searchTemplatesAction(query, { page: 1, limit: 12 });
			} else {
				await getTemplatesAction({ page: 1, limit: 12 });
			}
			isLoading = false;
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

	const handlePageChange = async (event) => {
		const newPage = event.detail;
		isLoading = true;
		
		if (searchQuery) {
			await searchTemplatesAction(searchQuery, { page: newPage, limit: 12 });
		} else {
			await getTemplatesAction({ page: newPage, limit: 12 });
		}
		
		isLoading = false;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	onMount(async () => {
		// Subscribe to data
		unsubscribeTemplates = templates.subscribe(t => templateList = t);
		unsubscribePagination = templatesPagination.subscribe(p => pagination = p);
		
		// Get User Plan
		await getPlanDetailsAction();
		unsubscribeUser = user.subscribe(u => {
			if (u) currentPlan = u.currentPlan;
		});

		// Initial Fetch
		await getTemplatesAction({ page: 1, limit: 12 });
		isLoading = false;
	});

	onDestroy(() => {
		unsubscribeTemplates();
		unsubscribePagination();
		unsubscribeUser();
		if (searchTimeout) clearTimeout(searchTimeout);
	});
</script>

<section class="min-h-full p-4 sm:p-6 md:p-10 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Grid -->
	<div class="absolute inset-0 opacity-5 pointer-events-none" 
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;">
	</div>

	<div class="max-w-7xl mx-auto relative z-10">
		
		<!-- Page Header -->
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
			<div>
				<div class="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3">
					<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
					Design Studio
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					Template <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Library</span>
				</h1>
			</div>
			
			<!-- Stats / Plan -->
			<div class="flex items-center gap-4 sm:gap-6 md:gap-8">
				<div class="text-right">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Templates</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 tabular-nums">{pagination.total || 0}</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6 md:pl-8">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">{currentPlan || 'Starter'}</div>
				</div>
			</div>
		</div>

		<!-- Controls Bar -->
		<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
			<!-- Search -->
			<div class="flex-grow relative max-w-2xl">
				<div class="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
					<svg class="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
				</div>
				<input
					type="text"
					placeholder="SEARCH TEMPLATES..."
					class="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white border-[2px] sm:border-[3px] border-gray-900 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] sm:focus:shadow-[6px_6px_0_0_#ffc480] focus:-translate-y-0.5 sm:focus:-translate-y-1 transition-all placeholder-gray-400"
					bind:value={searchQuery}
					on:input={handleSearchInput}
				/>
			</div>

			<!-- Create Button -->
			<button
				class="bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-black py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] sm:shadow-[6px_6px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] sm:hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[3px] sm:hover:translate-y-[3px] transition-all duration-200 uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm"
				on:click={openTemplateCreator}
			>
				<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
				</svg>
				<span class="hidden xs:inline">New Template</span>
				<span class="xs:hidden">New</span>
			</button>
		</div>

		<!-- Content Area -->
		<div class="relative min-h-[300px] sm:min-h-[400px]">
			{#if isLoading}
				<div class="absolute inset-0 flex items-center justify-center z-20 bg-[#FFFDF8]/80 backdrop-blur-sm rounded-xl">
					<Loader size="16" show={isLoading} />
				</div>
			{/if}

			{#if templateList.length === 0 && !isLoading}
				{#if searchQuery}
					<div class="text-center py-12 sm:py-16 md:py-20 bg-white rounded-xl sm:rounded-2xl md:rounded-3xl border-[2px] sm:border-[3px] border-gray-900 border-dashed shadow-sm px-4">
						<div class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 bg-gray-50 rounded-full border-[2px] sm:border-[3px] border-gray-900 flex items-center justify-center">
							<svg class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
							</svg>
						</div>
						<h3 class="text-lg sm:text-xl md:text-2xl font-black text-gray-900 uppercase tracking-wide mb-2">No Matches Found</h3>
						<p class="text-sm sm:text-base text-gray-500 font-bold max-w-md mx-auto">We couldn't find any templates matching "{searchQuery}"</p>
						<button 
							class="mt-4 sm:mt-6 text-xs sm:text-sm font-bold text-[#ff6b6b] hover:text-[#ff5252] uppercase tracking-wide underline decoration-2 underline-offset-4"
							on:click={() => { searchQuery = ''; handleSearchInput({ target: { value: '' } }); }}
						>
							Clear Search
						</button>
					</div>
				{:else}
					<EmptyTemplate />
				{/if}
			{:else if templateList.length > 0}
				<TemplateList 
					templates={templateList} 
					{pagination} 
					on:pageChange={handlePageChange} 
				/>
			{/if}
		</div>
	</div>
</section>