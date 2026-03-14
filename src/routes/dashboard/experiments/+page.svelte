<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		experiments,
		experimentQuota,
		experimentLoading,
		getExperimentsAction,
		getExperimentQuotaAction,
		deleteExperimentAction,
		startExperimentAction,
		pauseExperimentAction
	} from '../../../store/experiments.store';
	import { toast } from '../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { formatRelativeDate } from '$lib/utils/format.js';
	import { user } from '../../../store/user.store';
	import {
		checkFeatureAccessSync,
		FEATURES,
		getFeatureUpgradePrompt
	} from '../../../store/plg.store';
	import FeatureGate from '$lib/components/plg/FeatureGate.svelte';

	let isLoading = true;
	let typeFilter = '';
	let statusFilter = '';
	let currentPlan = '';
	let showDeleteConfirm = false;
	let experimentToDelete = null;
	let showCreateDropdown = false;

	let unsubscribeUser = () => {};

	// Feature gating
	$: abTestAccess = checkFeatureAccessSync(FEATURES.AB_TESTING);
	$: hasAccess = abTestAccess?.hasAccess ?? false;
	$: upgradePrompt = getFeatureUpgradePrompt(FEATURES.AB_TESTING);

	// Experiment type display mapping
	const typeLabels = {
		ab_test: 'A/B Test',
		smart_link: 'Smart Link',
		scheduled: 'Scheduled'
	};

	// Type badge colors
	const typeColors = {
		ab_test: 'bg-[#ffc480] text-gray-900 border-gray-900',
		smart_link: 'bg-[#4ade80] text-gray-900 border-gray-900',
		scheduled: 'bg-[#a78bfa] text-gray-900 border-gray-900'
	};

	// Status badge config
	const statusConfig = {
		draft: { bg: 'bg-white text-gray-900 border-gray-900', dot: 'bg-gray-400' },
		running: { bg: 'bg-[#4ade80] text-gray-900 border-gray-900', dot: 'bg-white' },
		paused: { bg: 'bg-[#ffc480] text-gray-900 border-gray-900', dot: 'bg-white' },
		completed: { bg: 'bg-[#60a5fa] text-gray-900 border-gray-900', dot: 'bg-white' },
		archived: { bg: 'bg-gray-200 text-gray-500 border-gray-900', dot: 'bg-gray-400' }
	};

	// Type filter options
	const typeFilters = [
		{ value: '', label: 'All' },
		{ value: 'ab_test', label: 'A/B Test' },
		{ value: 'smart_link', label: 'Smart Link' },
		{ value: 'scheduled', label: 'Scheduled' }
	];

	// Status filter options
	const statusFilters = [
		{ value: '', label: 'All Statuses' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'running', label: 'Running' },
		{ value: 'paused', label: 'Paused' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'archived', label: 'Archived' }
	];

	// Filtered experiments
	$: filteredExperiments = ($experiments || []).filter((exp) => {
		if (typeFilter && exp.type !== typeFilter) return false;
		if (statusFilter && exp.status !== statusFilter) return false;
		return true;
	});

	// Stats
	$: totalExperiments = ($experiments || []).length;
	$: runningCount = ($experiments || []).filter((e) => e.status === 'running').length;

	async function loadExperiments() {
		isLoading = true;
		try {
			const params = {};
			if (typeFilter) params.type = typeFilter;
			if (statusFilter) params.status = statusFilter;
			await Promise.all([getExperimentsAction(params), getExperimentQuotaAction()]);
		} finally {
			isLoading = false;
		}
	}

	function handleCreate() {
		showCreateDropdown = !showCreateDropdown;
	}

	function handleCreateType(type) {
		showCreateDropdown = false;
		if (type === 'smart_link') {
			goto('/dashboard/experiments/create/smart-link');
		} else if (type === 'scheduled') {
			goto('/dashboard/experiments/create/scheduled');
		} else {
			goto('/dashboard/experiments/create');
		}
	}

	function closeCreateDropdown() {
		showCreateDropdown = false;
	}

	function handleView(uid) {
		goto(`/dashboard/experiments/${uid}`);
	}

	async function handleStart(uid) {
		try {
			await startExperimentAction(uid);
			toast.set({ message: 'Experiment started successfully', type: 'success', duration: 3000 });
		} catch (error) {
			toast.set({
				message: error.message || 'Failed to start experiment',
				type: 'error',
				duration: 3000
			});
		}
	}

	async function handlePause(uid) {
		try {
			await pauseExperimentAction(uid);
			toast.set({ message: 'Experiment paused', type: 'success', duration: 3000 });
		} catch (error) {
			toast.set({
				message: error.message || 'Failed to pause experiment',
				type: 'error',
				duration: 3000
			});
		}
	}

	function confirmDelete(exp) {
		experimentToDelete = exp;
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		experimentToDelete = null;
	}

	async function handleDelete() {
		if (!experimentToDelete) return;
		try {
			await deleteExperimentAction(experimentToDelete.uid);
			toast.set({ message: 'Experiment deleted successfully', type: 'success', duration: 3000 });
			closeDeleteConfirm();
		} catch (error) {
			toast.set({
				message: error.message || 'Failed to delete experiment',
				type: 'error',
				duration: 3000
			});
		}
	}

	function handleFilterChange() {
		loadExperiments();
	}

	onMount(async () => {
		unsubscribeUser = user.subscribe((u) => {
			if (u) currentPlan = u.currentPlan;
		});
		await loadExperiments();
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
				<div
					class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3"
				>
					<span class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse" />
					Lab
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					Experi<span
						class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600"
						>ments</span
					>
				</h1>
			</div>

			<!-- Stats / Plan -->
			<div class="flex items-center gap-4 sm:gap-6 md:gap-8">
				<div class="text-right">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
						Total
					</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 tabular-nums tracking-wider">
						{hasAccess ? totalExperiments : 'LOCKED'}
					</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
						Running
					</div>
					<div
						class="text-lg sm:text-xl font-black text-green-600 tabular-nums flex items-center justify-end gap-2 tracking-wider"
					>
						{#if runningCount > 0}
							<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						{/if}
						{hasAccess ? runningCount : '-'}
					</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
						Current Plan
					</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-wider">
						{currentPlan || 'Starter'}
					</div>
				</div>
			</div>
		</div>

		<!-- Filter Bar -->
		<div class="flex flex-wrap gap-2 mb-6 sm:mb-8 items-center">
			{#each typeFilters as filter}
				<button
					on:click={() => {
						typeFilter = filter.value;
						handleFilterChange();
					}}
					class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[3px] border-gray-900 transition-all
					{typeFilter === filter.value
						? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#1f2937]'
						: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-[3px_3px_0_0_#1f2937]'}"
				>
					{filter.label}
				</button>
			{/each}

			<div class="flex-grow" />

			<!-- Status Filter Dropdown -->
			<div class="relative">
				<select
					bind:value={statusFilter}
					on:change={handleFilterChange}
					class="appearance-none pl-4 pr-10 py-2.5 bg-white border-[3px] border-gray-900 rounded-lg text-xs font-black uppercase tracking-wide text-gray-900 focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480] cursor-pointer shadow-[3px_3px_0_0_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0_0_#1f2937] transition-all"
				>
					{#each statusFilters as sf}
						<option value={sf.value}>{sf.label}</option>
					{/each}
				</select>
				<div
					class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-900"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M19 9l-7 7-7-7"
						/></svg
					>
				</div>
			</div>

			<!-- Create Button with Dropdown -->
			<div class="relative">
				<button
					on:click={handleCreate}
					class="px-5 py-2.5 bg-[#ffc480] text-gray-900 text-xs font-black uppercase tracking-wide rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M12 4v16m8-8H4"
						/></svg
					>
					New Experiment
					<svg
						class="w-3 h-3 transition-transform {showCreateDropdown ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M19 9l-7 7-7-7"
						/></svg
					>
				</button>

				{#if showCreateDropdown}
					<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
					<div class="fixed inset-0 z-40" on:click={closeCreateDropdown} />
					<div
						class="absolute right-0 top-full mt-2 z-50 w-72 bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] overflow-hidden"
					>
						<div class="px-4 py-3 bg-gray-50 border-b-[2px] border-gray-200">
							<span class="text-[10px] font-black uppercase tracking-widest text-gray-500"
								>Choose Type</span
							>
						</div>
						<div class="p-2">
							<button
								on:click={() => handleCreateType('ab_test')}
								class="w-full text-left px-4 py-3 rounded-lg hover:bg-[#4ade80]/10 transition-colors flex items-start gap-3 group"
							>
								<div
									class="w-8 h-8 bg-[#4ade80]/20 border-[2px] border-[#4ade80] rounded-lg flex items-center justify-center shrink-0 group-hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
								>
									<span class="text-sm">&#9878;</span>
								</div>
								<div>
									<div class="text-xs font-black text-gray-900 uppercase tracking-wide">
										A/B Test
									</div>
									<div class="text-[10px] font-bold text-gray-500 mt-0.5">
										Split traffic randomly between variants
									</div>
								</div>
							</button>
							<button
								on:click={() => handleCreateType('smart_link')}
								class="w-full text-left px-4 py-3 rounded-lg hover:bg-[#3b82f6]/10 transition-colors flex items-start gap-3 group"
							>
								<div
									class="w-8 h-8 bg-[#3b82f6]/20 border-[2px] border-[#3b82f6] rounded-lg flex items-center justify-center shrink-0 group-hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
								>
									<svg
										class="w-4 h-4 text-[#3b82f6]"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
										/></svg
									>
								</div>
								<div>
									<div class="text-xs font-black text-gray-900 uppercase tracking-wide">
										Smart Link
									</div>
									<div class="text-[10px] font-bold text-gray-500 mt-0.5">
										Route by device, geo, time, and more
									</div>
								</div>
							</button>
							<button
								on:click={() => handleCreateType('scheduled')}
								class="w-full text-left px-4 py-3 rounded-lg hover:bg-[#f59e0b]/10 transition-colors flex items-start gap-3 group"
							>
								<div
									class="w-8 h-8 bg-[#f59e0b]/20 border-[2px] border-[#f59e0b] rounded-lg flex items-center justify-center shrink-0"
								>
									<svg
										class="w-4 h-4 text-[#f59e0b]"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/></svg
									>
								</div>
								<div>
									<div class="text-xs font-black text-gray-900 uppercase tracking-wide">
										Scheduled
									</div>
									<div class="text-[10px] font-bold text-gray-500 mt-0.5">
										Time-based image rotation
									</div>
								</div>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Feature Gated Content -->
		<FeatureGate feature={FEATURES.AB_TESTING}>
			<div class="relative min-h-[400px]">
				{#if isLoading}
					<div
						class="absolute inset-0 flex items-center justify-center z-20 bg-[#FFFDF8]/80 backdrop-blur-sm"
					>
						<Loader size="16" show={isLoading} />
					</div>
				{/if}

				{#if filteredExperiments.length === 0 && !isLoading}
					<!-- Empty State -->
					<div
						class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-[3px] border-gray-900 border-dashed shadow-sm"
					>
						<div
							class="w-24 h-24 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] rounded-2xl border-[3px] border-gray-900 flex items-center justify-center mb-6 shadow-[6px_6px_0_0_#1f2937] -rotate-3 hover:rotate-0 transition-transform duration-300"
						>
							<!-- Beaker Icon -->
							<svg
								class="w-12 h-12 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
								/>
							</svg>
						</div>
						<h3 class="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">
							No experiments yet
						</h3>
						<p class="text-gray-500 font-bold max-w-md text-center mb-10 text-sm">
							Create A/B tests, smart links, and scheduled experiments to optimize your image
							performance and find the best performing variants.
						</p>
						<button
							on:click={() => handleCreateType('ab_test')}
							class="px-5 py-2.5 bg-[#ffc480] text-gray-900 text-xs font-black rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wide flex items-center gap-2 group"
						>
							Create Your First Experiment
							<svg
								class="w-5 h-5 group-hover:translate-x-1 transition-transform"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/></svg
							>
						</button>
					</div>
				{:else if !isLoading}
					<!-- Experiments Grid -->
					<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 lg:gap-8">
						{#each filteredExperiments as exp (exp.uid)}
							<div
								class="group bg-[#FFFDF8] border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-1 hover:-translate-x-1 transition-all duration-300 flex flex-col cursor-pointer relative"
								on:click={() => handleView(exp.uid)}
								on:keydown={(e) => e.key === 'Enter' && handleView(exp.uid)}
								role="button"
								tabindex="0"
							>
								<!-- Background Pattern -->
								<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

								<!-- Card Content Container -->
								<div class="relative z-10 flex flex-col h-full">
									<!-- Top Section: Image & Badges -->
									<div class="relative p-4 sm:p-5 border-b-[3px] border-gray-900 bg-white">
										<!-- Image Container (Neo brutalist container) -->
										<div class="aspect-[16/9] w-full bg-[#f8fafc] border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[4px_4px_0_0_#1f2937] relative">
											{#if exp.template?.thumbnail || exp.variants?.[0]?.templateThumbnail || exp.variants?.[0]?.preRenderedUrl}
												<img
													src={exp.template?.thumbnail || exp.variants?.[0]?.templateThumbnail || exp.variants?.[0]?.preRenderedUrl}
													alt="{exp.name} preview"
													class="w-full h-full object-cover"
												/>
											{:else}
												<div class="w-full h-full flex flex-col items-center justify-center bg-gray-50/80">
													<div class="w-12 h-12 bg-white rounded-lg border-[2px] border-gray-200 flex items-center justify-center mb-2 shadow-sm rotate-[-5deg]">
														<svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
													</div>
													<span class="text-[10px] font-black uppercase tracking-widest text-gray-400">No Preview</span>
												</div>
											{/if}
										</div>

										<!-- Floating Badges Top Left -->
										<div class="absolute top-6 left-6 flex flex-col items-start gap-2">
											<span
												class="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-[3px] shadow-[3px_3px_0_0_#1f2937] {typeColors[exp.type] || 'bg-white text-gray-900 border-gray-900'}"
											>
												{typeLabels[exp.type] || exp.type}
											</span>
										</div>

										<!-- Floating Status Top Right -->
										<div class="absolute top-6 right-6">
											<span
												class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border-[3px] shadow-[3px_3px_0_0_#000] {statusConfig[exp.status]?.bg || 'bg-white text-gray-900 border-gray-900'}"
											>
												<span
													class="w-2 h-2 rounded-full border-[1.5px] border-white {statusConfig[exp.status]?.dot || 'bg-gray-400'} {exp.status === 'running' ? 'animate-pulse' : ''}"
												/>
												{exp.status}
											</span>
										</div>
									</div>

									<!-- Bottom Section: Details & Actions -->
									<div class="p-4 sm:p-5 flex-grow flex flex-col bg-[#FFFDF8] relative">
										
										<!-- Quick actions on the right (delete) positioned absolutely for clean layout -->
										<div class="absolute top-4 right-4 sm:top-5 sm:right-5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
											<button
												on:click|stopPropagation={() => confirmDelete(exp)}
												class="w-8 h-8 bg-white border-[2px] border-gray-200 text-gray-400 rounded-lg hover:border-gray-900 hover:text-[#ff6b6b] hover:shadow-[3px_3px_0_0_#1f2937] hover:-translate-y-[1px] hover:-translate-x-[1px] transition-all flex items-center justify-center z-20"
												title="Delete"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
											</button>
										</div>

										<!-- Name & Title -->
										<div class="mb-4 pr-10">
											<h3
												class="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-3 line-clamp-2 decoration-[3px] decoration-[#ffc480]/50 group-hover:underline underline-offset-[6px]"
												title={exp.name}
											>
												{exp.name}
											</h3>
											
											<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
												<span class="flex items-center gap-1.5 px-2 py-1 bg-white border-[2px] border-gray-200 rounded-md">
													<svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
													{exp.variants?.length || 0} Variant{(exp.variants?.length || 0) !== 1 ? 's' : ''}
												</span>
												
												{#if exp.banditConfig?.enabled}
													<span class="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border-[2px] border-purple-200 rounded-md text-purple-600 shadow-[1px_1px_0_0_#d8b4fe]">
														<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
														Auto-Optimize
													</span>
												{/if}

												{#if exp.status === 'running'}
													<span class="flex items-center gap-1.5 text-green-700 bg-green-50 border-[2px] border-green-200 px-2 py-1 rounded-md shadow-[1px_1px_0_0_#bbf7d0]">
														<span class="relative flex h-2 w-2">
															<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
															<span class="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
														</span>
														{(exp.variants || []).reduce((s, v) => s + (v.impressions || 0), 0).toLocaleString()} Views
													</span>
												{:else}
													<span class="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-[2px] border-gray-200 rounded-md">
														<svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
														{formatRelativeDate(exp.createdAt)}
													</span>
												{/if}
											</div>
										</div>

										<div class="flex-grow"></div>

										<!-- Actions Bar -->
										<div class="mt-4 pt-4 border-t-[3px] border-gray-900 border-dashed flex items-center justify-between gap-3">
											<button
												on:click|stopPropagation={() => handleView(exp.uid)}
												class="flex-1 bg-white text-gray-900 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white group/btn"
											>
												<span>Open Editor</span>
												<svg class="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
											</button>

											{#if exp.status === 'draft' || exp.status === 'paused'}
												<button
													on:click|stopPropagation={() => handleStart(exp.uid)}
													class="w-12 h-12 bg-[#4ade80] text-gray-900 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center shrink-0 z-20"
													title="Start"
												>
													<svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
												</button>
											{:else if exp.status === 'running'}
												<button
													on:click|stopPropagation={() => handlePause(exp.uid)}
													class="w-12 h-12 bg-[#ffc480] text-gray-900 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center shrink-0 z-20"
													title="Pause"
												>
													<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
												</button>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</FeatureGate>
	</div>
</section>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && experimentToDelete}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
		on:click={closeDeleteConfirm}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div
			class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] max-w-md w-full overflow-hidden animate-fade-in-up"
			on:click|stopPropagation
		>
			<!-- Modal Header -->
			<div class="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div
						class="w-3 h-3 bg-[#ff6b6b] rounded-full border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]"
					/>
					<h2 class="font-black text-sm uppercase tracking-widest text-[#ff6b6b]">
						Delete Experiment?
					</h2>
				</div>
				<button
					class="text-gray-400 hover:text-white transition-colors"
					on:click={closeDeleteConfirm}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M6 18L18 6M6 6l12 12"
						/></svg
					>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				<div class="flex items-start gap-4 mb-8">
					<div
						class="w-14 h-14 bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 flex items-center justify-center shrink-0 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] -rotate-3"
					>
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/></svg
						>
					</div>
					<div>
						<p class="text-sm font-bold text-gray-900 mb-2 leading-relaxed">
							This action cannot be undone. All experiment data, variants, and analytics will be
							permanently deleted.
						</p>
						<div
							class="mt-4 px-4 py-3 bg-gray-100 rounded-xl border-[3px] border-gray-900 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]"
						>
							<span
								class="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1"
								>Target Experiment</span
							>
							<p class="text-base font-black text-gray-900 truncate">{experimentToDelete.name}</p>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-4">
					<button
						on:click={closeDeleteConfirm}
						class="flex-1 px-4 py-3.5 bg-white border-[3px] border-gray-900 text-gray-900 rounded-xl font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs"
					>
						Cancel
					</button>
					<button
						on:click={handleDelete}
						class="flex-[1.5] px-4 py-3.5 bg-[#ff6b6b] text-white rounded-xl font-black uppercase tracking-wide border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs flex items-center justify-center gap-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/></svg
						>
						Delete Permanently
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<Toast />
