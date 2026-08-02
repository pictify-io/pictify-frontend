<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { user, getPlanDetailsAction } from '../../../store/user.store';
	import {
		getTemplatesAction,
		searchTemplatesAction,
		templates,
		templatesPagination,
		templateCounts
	} from '../../../store/template.store';
	import { getVideoTemplates } from '../../../api/videoTemplates';
	import TemplateList from '$lib/components/dashboard/template/TemplateList.svelte';
	import CreateTemplateChooser from '$lib/components/dashboard/template/CreateTemplateChooser.svelte';
	import EmptyTemplate from '$lib/components/dashboard/template/EmptyTemplate.svelte';
	import Skeleton from '$lib/components/dashboard/Skeleton.svelte';
	import { FeatureUpgradePrompt } from '$lib/components/plg';
	import {
		checkFeatureAccessSync,
		FEATURES,
		PLAN_DISPLAY_NAMES,
		getFeatureUpgradePrompt,
		formatLimit
	} from '../../../store/plg.store';

	let unsubscribeTemplates = () => {};
	let unsubscribePagination = () => {};
	let unsubscribeUser = () => {};

	let templateList = [];
	let pagination = { page: 1, limit: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false };
	let isLoading = true;
	let searchQuery = '';
	let searchTimeout;
	let currentPlan = '';
	let formatFilter = 'all'; // 'all' | 'image' | 'pdf' | 'video'
	let showTemplateLimitPrompt = false;

	// ── Video templates ──────────────────────────────────────────────────────
	// Video templates are a separate model on their own unpaginated endpoint, so
	// they can't come back from getTemplatesAction. They're fetched once and
	// merged in client-side: shown on page 1 of "All" (newest first, alongside
	// the paginated image/PDF templates) and on their own under the Video chip.
	// They are NOT counted toward pagination.total — that number drives the
	// saved-template plan limit, which meters the Template model only.
	let videoTemplateList = [];

	const normalizeVideoTemplate = (t) => ({
		...t,
		isVideoTemplate: true,
		outputFormat: 'video',
		engine: 'video',
		thumbnail: t.posterUrl || null
	});

	const loadVideoTemplates = async () => {
		try {
			const response = await getVideoTemplates();
			videoTemplateList = (response?.templates || []).map(normalizeVideoTemplate);
		} catch (error) {
			// A video-template outage must not take out the whole Templates page.
			videoTemplateList = [];
		}
	};

	// What the grid actually renders, per filter.
	$: displayedTemplates =
		formatFilter === 'video'
			? videoTemplateList
			: formatFilter === 'all' && pagination.page === 1 && !searchQuery
			? [...videoTemplateList, ...templateList]
			: templateList;

	// The Video chip is a single client-side page — hide the pager rather than
	// show a "page 1 of 1" control that does nothing.
	$: videoOnlyPagination = {
		page: 1,
		limit: videoTemplateList.length || 12,
		total: videoTemplateList.length,
		totalPages: 1,
		hasNext: false,
		hasPrev: false
	};

	// Template limit checking
	$: templateFeatureAccess = checkFeatureAccessSync(FEATURES.TEMPLATES_SAVED);
	$: templateLimit = templateFeatureAccess?.limit;
	$: hasTemplateAccess = templateFeatureAccess?.hasAccess ?? true;
	// Templates and video templates are one library sharing one cap, so the
	// count shown (and the limit check) must include both. Counting only
	// pagination.total let video templates bypass the plan limit entirely.
	$: savedTemplateCount = (pagination.total || 0) + videoTemplateList.length;

	// Chip counts. Image/PDF come from the server (unfiltered, so they persist
	// while another chip is active); video is client-side.
	$: chipCounts = {
		all: ($templateCounts.all || 0) + videoTemplateList.length,
		image: $templateCounts.image || 0,
		pdf: $templateCounts.pdf || 0,
		video: videoTemplateList.length
	};
	$: isAtTemplateLimit = typeof templateLimit === 'number' && savedTemplateCount >= templateLimit;
	$: templateUpgradePrompt = getFeatureUpgradePrompt(FEATURES.TEMPLATES_SAVED);

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
				await getTemplatesAction({ page: 1, limit: 12, outputFormat: formatFilter });
			}
			isLoading = false;
		}, 300);
	};

	// Handle format filter change
	const handleFilterChange = async (newFilter) => {
		formatFilter = newFilter;
		isLoading = true;

		if (newFilter === 'video') {
			// Video templates are already in memory and the backend template
			// endpoint has no 'video' outputFormat — refetching would return an
			// empty list and blank the grid.
			await loadVideoTemplates();
			isLoading = false;
			return;
		}

		// Reset to page 1 when filter changes
		if (searchQuery) {
			// For now, search doesn't support outputFormat - just refetch
			await searchTemplatesAction(searchQuery, { page: 1, limit: 12 });
		} else {
			await getTemplatesAction({
				page: 1,
				limit: 12,
				outputFormat: newFilter
			});
		}

		isLoading = false;
	};

	// The two engines produce different things (HTML -> png/jpg/pdf, video -> mp4)
	// and open different editors, so the kind is chosen before the editor loads.
	let showTypeChooser = false;

	const openTemplateCreator = () => {
		// Check if user is at their template limit
		if (isAtTemplateLimit) {
			showTemplateLimitPrompt = true;
			return;
		}
		showTypeChooser = true;
	};

	const handleTypeChosen = (event) => {
		showTypeChooser = false;
		// Canvas engine retired (2026-07): HTML is the only image/PDF engine.
		goto(
			event.detail === 'video'
				? '/dashboard/video-templates/new'
				: '/template-workspace/html/create?engine=html'
		);
	};

	const handlePageChange = async (event) => {
		const newPage = event.detail;
		isLoading = true;

		if (searchQuery) {
			await searchTemplatesAction(searchQuery, { page: newPage, limit: 12 });
		} else {
			await getTemplatesAction({
				page: newPage,
				limit: 12,
				outputFormat: formatFilter
			});
		}

		isLoading = false;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	onMount(async () => {
		// ?type=video deep-links the Video chip, so "back" from the video studio
		// returns to the filter the user was actually on.
		const typeParam = $page.url.searchParams.get('type');
		if (['image', 'pdf', 'video'].includes(typeParam)) formatFilter = typeParam;

		// Subscribe to data
		unsubscribeTemplates = templates.subscribe((t) => (templateList = t));
		unsubscribePagination = templatesPagination.subscribe((p) => (pagination = p));

		// Get User Plan
		await getPlanDetailsAction();
		unsubscribeUser = user.subscribe((u) => {
			if (u) currentPlan = u.currentPlan;
		});

		// Initial Fetch. Video templates load in parallel and never block the
		// main grid — loadVideoTemplates swallows its own failures.
		await Promise.all([
			getTemplatesAction({ page: 1, limit: 12, outputFormat: formatFilter }),
			loadVideoTemplates()
		]);
		isLoading = false;
	});

	onDestroy(() => {
		unsubscribeTemplates();
		unsubscribePagination();
		unsubscribeUser();
		if (searchTimeout) clearTimeout(searchTimeout);
	});
</script>

<section class="min-h-full">
	<div>
		<!-- Page Header -->
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
			<div>
				<div
					class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3"
				>
					<span class="w-2 h-2 bg-brand-accent rounded-full" />
					Design Studio
				</div>
				<h1
					class="text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-black text-gray-900 tracking-tighter"
				>
					Template <span class="text-gray-900">Library</span>
				</h1>
			</div>

			<!-- Stats / Plan -->
			<div class="flex items-center gap-4 sm:gap-6 md:gap-8">
				<div class="text-right">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
						Templates
					</div>
					<div
						class="text-lg sm:text-xl font-black tabular-nums {isAtTemplateLimit
							? 'text-brand-danger'
							: 'text-gray-900'}"
					>
						{savedTemplateCount}{#if typeof templateLimit === 'number'}<span
								class="text-gray-600">/{formatLimit(templateLimit)}</span
							>{/if}
					</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6 md:pl-8">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
						Plan
					</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">
						{currentPlan || 'Starter'}
					</div>
				</div>
			</div>
		</div>

		<!-- Controls Bar -->
		<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
			<!-- Search -->
			<div class="flex-grow relative max-w-2xl">
				<div class="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
					<svg
						class="w-4 h-4 sm:w-5 sm:h-5 text-gray-900"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<input
					type="text"
					placeholder="SEARCH TEMPLATES..."
					class="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 lg:py-3 bg-white border-[2px] sm:border-[3px] border-gray-900 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide focus:outline-none focus:shadow-brutal-accent sm:focus:shadow-[6px_6px_0_0_#ffc480] focus:-translate-y-0.5 sm:focus:-translate-y-1 transition-all placeholder-gray-400"
					bind:value={searchQuery}
					on:input={handleSearchInput}
				/>
			</div>

			<!-- Create Button -->
			<button
				class="font-black py-3 sm:py-4 lg:py-3 px-6 sm:px-8 lg:px-6 rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] border-gray-900 shadow-brutal-lg sm:shadow-brutal-xl hover:shadow-brutal-sm sm:hover:shadow-brutal-md hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[3px] sm:hover:translate-y-[3px] transition-all duration-200 uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm
				{isAtTemplateLimit ? 'bg-gray-400 text-white' : 'bg-brand-accent hover:bg-[#ffb968] text-gray-900'}"
				on:click={openTemplateCreator}
			>
				{#if isAtTemplateLimit}
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					<span class="hidden xs:inline">Limit Reached</span>
					<span class="xs:hidden">Limit</span>
				{:else}
					<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					<span class="hidden xs:inline">New Template</span>
					<span class="xs:hidden">New</span>
				{/if}
			</button>
		</div>

		<!-- Content Area -->
		<div class="relative min-h-[300px] sm:min-h-[400px]">
			<!-- Filters -->
			<div class="flex flex-wrap items-center gap-3 mb-6 py-3 border-b border-transparent">
				<!-- Format Filters -->
				<button
					on:click={() => handleFilterChange('all')}
					class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[2px] border-gray-900 transition-all
						{formatFilter === 'all'
						? 'bg-gray-900 text-white shadow-brutal-md'
						: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-brutal-sm'}"
				>
					All
					{#if chipCounts.all}
						<span
							class="ml-0.5 px-1.5 py-0.5 rounded text-[10px] tabular-nums {formatFilter === 'all'
								? 'bg-white/20 text-white'
								: 'bg-gray-100 text-gray-700'}">{chipCounts.all}</span
						>
					{/if}
				</button>

				<button
					on:click={() => handleFilterChange('image')}
					class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[2px] border-gray-900 transition-all flex items-center gap-2
						{formatFilter === 'image'
						? 'bg-gray-900 text-white shadow-brutal-md'
						: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-brutal-sm'}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/></svg
					>
					Image
					{#if chipCounts.image}
						<span
							class="ml-0.5 px-1.5 py-0.5 rounded text-[10px] tabular-nums {formatFilter === 'image'
								? 'bg-white/20 text-white'
								: 'bg-gray-100 text-gray-700'}">{chipCounts.image}</span
						>
					{/if}
				</button>

				<button
					on:click={() => handleFilterChange('pdf')}
					class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[2px] border-gray-900 transition-all flex items-center gap-2
						{formatFilter === 'pdf'
						? 'bg-gray-900 text-white shadow-brutal-md'
						: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-brutal-sm'}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/></svg
					>
					PDF
					{#if chipCounts.pdf}
						<span
							class="ml-0.5 px-1.5 py-0.5 rounded text-[10px] tabular-nums {formatFilter === 'pdf'
								? 'bg-white/20 text-white'
								: 'bg-gray-100 text-gray-700'}">{chipCounts.pdf}</span
						>
					{/if}
				</button>

				<button
					on:click={() => handleFilterChange('video')}
					class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[2px] border-gray-900 transition-all flex items-center gap-2
						{formatFilter === 'video'
						? 'bg-gray-900 text-white shadow-brutal-md'
						: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-brutal-sm'}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/></svg
					>
					Video
					{#if chipCounts.video}
						<span
							class="ml-0.5 px-1.5 py-0.5 rounded text-[10px] tabular-nums {formatFilter ===
							'video'
								? 'bg-white/20 text-white'
								: 'bg-gray-100 text-gray-700'}">{chipCounts.video}</span
						>
					{/if}
				</button>
			</div>
			{#if isLoading}
				<!-- Skeleton grid — 6 cards matching the real template card shape -->
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full mt-6 sm:mt-8"
				>
					{#each Array(6) as _}
						<div
							class="bg-white rounded-xl border-[3px] border-gray-200 shadow-brutal-lg overflow-hidden flex flex-col"
						>
							<!-- Card tab bar -->
							<Skeleton class="h-8 rounded-none border-b-[3px] border-gray-200" />
							<!-- Thumbnail -->
							<Skeleton class="aspect-[4/3] rounded-none" />
							<!-- Footer info -->
							<div class="px-4 pt-4 pb-3 flex flex-col gap-3 border-t-[3px] border-gray-200">
								<Skeleton class="h-5 w-3/4" />
								<div class="flex gap-2">
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-4 w-20" />
								</div>
							</div>
							<!-- Action bar — two cells, matching the real card's
							     Render / Workflow pair -->
							<div class="grid grid-cols-2 border-t-[3px] border-gray-200">
								{#each Array(2) as _}
									<Skeleton class="h-10 rounded-none" />
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if displayedTemplates.length === 0 && !isLoading}
				{#if searchQuery}
					<div
						class="text-center py-12 sm:py-16 md:py-20 bg-white rounded-xl sm:rounded-2xl md:rounded-2xl border-[2px] sm:border-[3px] border-gray-900 border-dashed shadow-sm px-4"
					>
						<div
							class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 bg-gray-50 rounded-full border-[2px] sm:border-[3px] border-gray-900 flex items-center justify-center"
						>
							<svg
								class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
						<h3
							class="text-lg sm:text-xl md:text-2xl font-black text-gray-900 uppercase tracking-wide mb-2"
						>
							No Matches Found
						</h3>
						<p class="text-sm sm:text-base text-gray-500 font-bold max-w-md mx-auto">
							We couldn't find any templates matching "{searchQuery}"
						</p>
						<button
							class="mt-4 sm:mt-6 text-xs sm:text-sm font-bold text-brand-danger hover:text-data-red uppercase tracking-wide underline decoration-2 underline-offset-4"
							on:click={() => {
								searchQuery = '';
								handleSearchInput({ target: { value: '' } });
							}}
						>
							Clear Search
						</button>
					</div>
				{:else}
					<EmptyTemplate on:create={openTemplateCreator} />
				{/if}
			{:else if displayedTemplates.length > 0}
				<TemplateList
					templates={displayedTemplates}
					pagination={formatFilter === 'video' ? videoOnlyPagination : pagination}
					on:pageChange={handlePageChange}
				/>
			{/if}
		</div>
	</div>

	{#if showTemplateLimitPrompt && templateUpgradePrompt}
		<FeatureUpgradePrompt
			feature={FEATURES.TEMPLATES_SAVED}
			currentPlan={templateFeatureAccess.currentPlan}
			targetPlan={templateUpgradePrompt.targetPlan}
			variant="modal"
			show={showTemplateLimitPrompt}
			onDismiss={() => (showTemplateLimitPrompt = false)}
		/>
	{/if}
</section>

<CreateTemplateChooser
	open={showTypeChooser}
	on:choose={handleTypeChosen}
	on:close={() => (showTypeChooser = false)}
/>
