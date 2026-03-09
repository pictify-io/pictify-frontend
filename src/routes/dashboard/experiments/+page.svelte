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
		pauseExperimentAction,
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
		scheduled: 'Scheduled',
	};

	// Type badge colors
	const typeColors = {
		ab_test: 'bg-[#ffc480] text-gray-900 border-gray-900',
		smart_link: 'bg-[#4ade80] text-gray-900 border-gray-900',
		scheduled: 'bg-[#a78bfa] text-gray-900 border-gray-900',
	};

	// Status badge config
	const statusConfig = {
		draft: { bg: 'bg-gray-100 text-gray-700 border-gray-900', dot: 'bg-gray-400' },
		running: { bg: 'bg-[#4ade80]/20 text-gray-900 border-gray-900', dot: 'bg-[#4ade80]' },
		paused: { bg: 'bg-[#ffc480]/20 text-gray-900 border-gray-900', dot: 'bg-[#ffc480]' },
		completed: { bg: 'bg-[#60a5fa]/20 text-gray-900 border-gray-900', dot: 'bg-[#60a5fa]' },
		archived: { bg: 'bg-gray-100 text-gray-500 border-gray-900', dot: 'bg-gray-400' }
	};

	// Type filter options
	const typeFilters = [
		{ value: '', label: 'All' },
		{ value: 'ab_test', label: 'A/B Test' },
		{ value: 'smart_link', label: 'Smart Link' },
		{ value: 'scheduled', label: 'Scheduled' },
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
	$: filteredExperiments = ($experiments || []).filter(exp => {
		if (typeFilter && exp.type !== typeFilter) return false;
		if (statusFilter && exp.status !== statusFilter) return false;
		return true;
	});

	// Stats
	$: totalExperiments = ($experiments || []).length;
	$: runningCount = ($experiments || []).filter(e => e.status === 'running').length;

	async function loadExperiments() {
		isLoading = true;
		try {
			const params = {};
			if (typeFilter) params.type = typeFilter;
			if (statusFilter) params.status = statusFilter;
			await Promise.all([
				getExperimentsAction(params),
				getExperimentQuotaAction()
			]);
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
			toast.set({ message: error.message || 'Failed to start experiment', type: 'error', duration: 3000 });
		}
	}

	async function handlePause(uid) {
		try {
			await pauseExperimentAction(uid);
			toast.set({ message: 'Experiment paused', type: 'success', duration: 3000 });
		} catch (error) {
			toast.set({ message: error.message || 'Failed to pause experiment', type: 'error', duration: 3000 });
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
			toast.set({ message: error.message || 'Failed to delete experiment', type: 'error', duration: 3000 });
		}
	}

	function handleFilterChange() {
		loadExperiments();
	}

	onMount(async () => {
		unsubscribeUser = user.subscribe(u => {
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
				<div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3">
					<span class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
					Lab
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					Experi<span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">ments</span>
				</h1>
			</div>

			<!-- Stats / Plan -->
			<div class="flex items-center gap-4 sm:gap-6 md:gap-8">
				<div class="text-right">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Total</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 tabular-nums tracking-wider">{hasAccess ? totalExperiments : 'LOCKED'}</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Running</div>
					<div class="text-lg sm:text-xl font-black text-green-600 tabular-nums flex items-center justify-end gap-2 tracking-wider">
						{#if runningCount > 0}
							<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
						{/if}
						{hasAccess ? runningCount : '-'}
					</div>
				</div>
				<div class="text-right border-l-2 border-gray-200 pl-4 sm:pl-6">
					<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Current Plan</div>
					<div class="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-wider">{currentPlan || 'Starter'}</div>
				</div>
			</div>
		</div>

		<!-- Filter Bar -->
		<div class="flex flex-wrap gap-2 mb-6 sm:mb-8 items-center">
			{#each typeFilters as filter}
				<button
					on:click={() => { typeFilter = filter.value; handleFilterChange(); }}
					class="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide border-[3px] border-gray-900 transition-all
					{typeFilter === filter.value
						? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#1f2937]'
						: 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-[3px_3px_0_0_#1f2937]'}"
				>
					{filter.label}
				</button>
			{/each}

			<div class="flex-grow"></div>

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
				<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-900">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
				</div>
			</div>

			<!-- Create Button with Dropdown -->
			<div class="relative">
				<button
					on:click={handleCreate}
					class="px-5 py-2.5 bg-[#ffc480] text-gray-900 text-xs font-black uppercase tracking-wide rounded-lg border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
					New Experiment
					<svg class="w-3 h-3 transition-transform {showCreateDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
				</button>

				{#if showCreateDropdown}
					<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
					<div class="fixed inset-0 z-40" on:click={closeCreateDropdown}></div>
					<div class="absolute right-0 top-full mt-2 z-50 w-72 bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] overflow-hidden">
						<div class="px-4 py-3 bg-gray-50 border-b-[2px] border-gray-200">
							<span class="text-[10px] font-black uppercase tracking-widest text-gray-500">Choose Type</span>
						</div>
						<div class="p-2">
							<button
								on:click={() => handleCreateType('ab_test')}
								class="w-full text-left px-4 py-3 rounded-lg hover:bg-[#4ade80]/10 transition-colors flex items-start gap-3 group"
							>
								<div class="w-8 h-8 bg-[#4ade80]/20 border-[2px] border-[#4ade80] rounded-lg flex items-center justify-center shrink-0 group-hover:shadow-[2px_2px_0_0_#1f2937] transition-all">
									<span class="text-sm">&#9878;</span>
								</div>
								<div>
									<div class="text-xs font-black text-gray-900 uppercase tracking-wide">A/B Test</div>
									<div class="text-[10px] font-bold text-gray-500 mt-0.5">Split traffic randomly between variants</div>
								</div>
							</button>
							<button
								on:click={() => handleCreateType('smart_link')}
								class="w-full text-left px-4 py-3 rounded-lg hover:bg-[#3b82f6]/10 transition-colors flex items-start gap-3 group"
							>
								<div class="w-8 h-8 bg-[#3b82f6]/20 border-[2px] border-[#3b82f6] rounded-lg flex items-center justify-center shrink-0 group-hover:shadow-[2px_2px_0_0_#1f2937] transition-all">
									<svg class="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
								</div>
								<div>
									<div class="text-xs font-black text-gray-900 uppercase tracking-wide">Smart Link</div>
									<div class="text-[10px] font-bold text-gray-500 mt-0.5">Route by device, geo, time, and more</div>
								</div>
							</button>
							<button
								on:click={() => handleCreateType('scheduled')}
								class="w-full text-left px-4 py-3 rounded-lg hover:bg-[#f59e0b]/10 transition-colors flex items-start gap-3 group"
							>
								<div class="w-8 h-8 bg-[#f59e0b]/20 border-[2px] border-[#f59e0b] rounded-lg flex items-center justify-center shrink-0">
									<svg class="w-4 h-4 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
								</div>
								<div>
									<div class="text-xs font-black text-gray-900 uppercase tracking-wide">Scheduled</div>
									<div class="text-[10px] font-bold text-gray-500 mt-0.5">Time-based image rotation</div>
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
					<div class="absolute inset-0 flex items-center justify-center z-20 bg-[#FFFDF8]/80 backdrop-blur-sm">
						<Loader size="16" show={isLoading} />
					</div>
				{/if}

				{#if filteredExperiments.length === 0 && !isLoading}
					<!-- Empty State -->
					<div class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-[3px] border-gray-900 border-dashed shadow-sm">
						<div class="w-24 h-24 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] rounded-2xl border-[3px] border-gray-900 flex items-center justify-center mb-6 shadow-[6px_6px_0_0_#1f2937] -rotate-3 hover:rotate-0 transition-transform duration-300">
							<!-- Beaker Icon -->
							<svg class="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
							</svg>
						</div>
						<h3 class="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">
							No experiments yet
						</h3>
						<p class="text-gray-500 font-bold max-w-md text-center mb-10 text-sm">
							Create A/B tests, smart links, and scheduled experiments to optimize your image performance and find the best performing variants.
						</p>
						<button
							on:click={() => handleCreateType('ab_test')}
							class="px-5 py-2.5 bg-[#ffc480] text-gray-900 text-xs font-black rounded-lg border-[2px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wide flex items-center gap-2 group"
						>
							Create Your First Experiment
							<svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
						</button>
					</div>
				{:else if !isLoading}
					<!-- Experiments Grid -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{#each filteredExperiments as exp (exp.uid)}
							<div class="group bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[6px_6px_0_0_#1f2937] hover:shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1 transition-all duration-300 flex flex-col">
								
								<!-- Visual Header Banner -->
								<div class="relative h-24 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] border-b-[3px] border-gray-900 flex items-center justify-between px-6 overflow-hidden">
									<!-- Abstract Decorative Elements -->
									<div class="absolute -right-4 -top-4 w-24 h-24 bg-[#ffc480]/20 rounded-full blur-xl"></div>
									<div class="absolute -left-4 -bottom-4 w-24 h-24 bg-[#4ade80]/20 rounded-full blur-xl"></div>
									
									<h3 class="text-2xl font-black text-gray-900 truncate relative z-10 max-w-[70%]" title={exp.name}>
										{exp.name}
									</h3>
									
									<div class="flex flex-col gap-2 relative z-10 items-end shrink-0">
										<!-- Type Badge -->
										<span class="inline-flex items-center px-2 py-0.5 rounded shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] text-[9px] font-black uppercase tracking-widest border-[2px] {typeColors[exp.type] || 'bg-gray-100 text-gray-700 border-gray-900'}">
											{typeLabels[exp.type] || exp.type}
										</span>
										{#if exp.banditConfig?.enabled}
											<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] text-[9px] font-black uppercase tracking-widest border-[2px] bg-[#a855f7]/20 text-[#7c3aed] border-[#a855f7]">
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
												Auto-Optimize
											</span>
										{/if}
										<!-- Status Badge -->
										<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded shadow-[2px_2px_0_0_rgba(0,0,0,0.1)] text-[9px] font-black uppercase tracking-widest border-[2px] {statusConfig[exp.status]?.bg || 'bg-gray-100 text-gray-700 border-gray-900'}">
											<span class="w-1.5 h-1.5 rounded-full {statusConfig[exp.status]?.dot || 'bg-gray-400'} {exp.status === 'running' ? 'animate-pulse' : ''}"></span>
											{exp.status}
										</span>
									</div>
								</div>

								<!-- Card Body (Stats & Details) -->
								<div class="p-6 flex-grow flex flex-col justify-center bg-white space-y-4">
									<!-- Info Grid -->
									<div class="grid grid-cols-2 gap-4">
										<!-- Variants -->
										<div class="bg-gray-50 border-[2px] border-gray-900 rounded-lg p-3">
											<div class="flex items-center gap-2 mb-1">
												<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
												<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Variants</span>
											</div>
											<div class="text-lg font-black text-gray-900 tabular-nums">
												{exp.variants?.length || 0}
											</div>
										</div>

										<!-- Impressions (if running, else created date) -->
										<div class="bg-gray-50 border-[2px] border-gray-900 rounded-lg p-3">
											{#if exp.status === 'running' && exp.totalImpressions != null}
												<div class="flex items-center gap-2 mb-1">
													<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
													<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Impressions</span>
												</div>
												<div class="text-lg font-black text-green-600 tabular-nums">
													{exp.totalImpressions.toLocaleString()}
												</div>
											{:else}
												<div class="flex items-center gap-2 mb-1">
													<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
													<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Created</span>
												</div>
												<div class="text-lg font-black text-gray-900 tabular-nums truncate">
													{formatRelativeDate(exp.createdAt)}
												</div>
											{/if}
										</div>
									</div>

									<!-- Template Reference -->
									{#if exp.templateUid}
										<div class="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border-[2px] border-gray-200">
											<svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
											<span class="text-xs font-bold text-gray-600 truncate">
												Based on <span class="font-black text-gray-900">{exp.templateName || exp.templateUid}</span>
											</span>
										</div>
									{/if}
								</div>

								<!-- Action Control Panel Footer -->
								<div class="p-4 border-t-[3px] border-gray-900 bg-[#FFFDF8] flex items-center gap-3">
									<!-- View Button (Primary Action) -->
									<button
										on:click={() => handleView(exp.uid)}
										class="flex-1 px-4 py-2.5 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-lg border-[3px] border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
										View Setup
									</button>

									<!-- Start / Pause Button -->
									{#if exp.status === 'draft' || exp.status === 'paused'}
										<button
											on:click={() => handleStart(exp.uid)}
											class="w-11 h-11 bg-[#4ade80] text-gray-900 rounded-lg border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center shrink-0"
											title="Start Experiment"
										>
											<svg class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
										</button>
									{:else if exp.status === 'running'}
										<button
											on:click={() => handlePause(exp.uid)}
											class="w-11 h-11 bg-[#ffc480] text-gray-900 rounded-lg border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center shrink-0"
											title="Pause Experiment"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
										</button>
									{/if}

									<!-- Delete Button -->
									<button
										on:click={() => confirmDelete(exp)}
										class="w-11 h-11 bg-white text-[#ff6b6b] rounded-lg border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#ff6b6b] hover:border-[#ff6b6b] hover:bg-[#ff6b6b]/10 hover:-translate-y-[1px] transition-all flex items-center justify-center shrink-0"
										title="Delete Experiment"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
									</button>
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
					<div class="w-3 h-3 bg-[#ff6b6b] rounded-full border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]"></div>
					<h2 class="font-black text-sm uppercase tracking-widest text-[#ff6b6b]">Delete Experiment?</h2>
				</div>
				<button class="text-gray-400 hover:text-white transition-colors" on:click={closeDeleteConfirm}>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				<div class="flex items-start gap-4 mb-8">
					<div class="w-14 h-14 bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 flex items-center justify-center shrink-0 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] -rotate-3">
						<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
					</div>
					<div>
						<p class="text-sm font-bold text-gray-900 mb-2 leading-relaxed">
							This action cannot be undone. All experiment data, variants, and analytics will be permanently deleted.
						</p>
						<div class="mt-4 px-4 py-3 bg-gray-100 rounded-xl border-[3px] border-gray-900 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
							<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Target Experiment</span>
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
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
						Delete Permanently
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<Toast />
