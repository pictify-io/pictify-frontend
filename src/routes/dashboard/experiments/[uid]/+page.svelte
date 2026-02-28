<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		experiment,
		experimentAnalytics,
		experimentLoading,
		getExperimentAction,
		getExperimentAnalyticsAction,
		updateExperimentAction,
		startExperimentAction,
		pauseExperimentAction,
		completeExperimentAction,
		deleteExperimentAction
	} from '../../../../store/experiments.store';
	import { toast } from '../../../../store/toast.store';
	import Toast from '$lib/components/Toast.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { formatRelativeDate, copyToClipboard } from '$lib/utils/format.js';

	// ============== State ==============
	let exp = null;
	let analytics = null;
	let isLoading = true;
	let showDeclareWinner = false;
	let selectedWinner = null;
	let showDeleteConfirm = false;
	let showEditMode = false;
	let showSettings = false;
	let editName = '';
	let editHypothesis = '';
	let refreshInterval = null;

	let unsubExperiment = () => {};
	let unsubAnalytics = () => {};

	// ============== Derived ==============
	$: uid = $page.params.uid;

	$: typeLabels = {
		ab_test: 'A/B Test',
		smart_link: 'Smart Link',
		scheduled: 'Scheduled',
		bandit: 'Auto-Optimize'
	};

	$: typeColors = {
		ab_test: 'bg-blue-100 text-blue-800 border-blue-800',
		smart_link: 'bg-purple-100 text-purple-800 border-purple-800',
		scheduled: 'bg-amber-100 text-amber-800 border-amber-800',
		bandit: 'bg-emerald-100 text-emerald-800 border-emerald-800'
	};

	$: statusColors = {
		draft: 'bg-gray-100 text-gray-700 border-gray-700',
		running: 'bg-green-100 text-green-800 border-green-800',
		paused: 'bg-yellow-100 text-yellow-800 border-yellow-800',
		completed: 'bg-blue-100 text-blue-800 border-blue-800'
	};

	$: variants = exp?.variants || [];

	$: totalImpressions = analytics?.totalImpressions
		?? variants.reduce((sum, v) => sum + (v.impressions || 0), 0);

	$: totalClicks = analytics?.totalClicks
		?? variants.reduce((sum, v) => sum + (v.clicks || 0), 0);

	$: clickRate = totalImpressions > 0
		? ((totalClicks / totalImpressions) * 100).toFixed(2)
		: '0.00';

	$: maxImpressions = Math.max(...variants.map(v => v.impressions || 0), 1);

	$: isClickGoal = exp?.goalConfig?.type === 'click_through' || exp?.goalConfig?.type === 'ctr';

	$: publicUrl = exp?.slug
		? `pictify.io/s/${exp.slug}.${exp?.outputConfig?.format || 'png'}`
		: '';

	$: embedCode = publicUrl
		? `<img src="https://${publicUrl}" alt="${exp?.name || 'Experiment'}" />`
		: '';

	$: runningDuration = getRunningDuration(exp);

	// ============== Helpers ==============

	function getBarWidth(impressions, max) {
		if (!max) return 0;
		return Math.round((impressions / max) * 100);
	}

	function getRunningDuration(experiment) {
		if (!experiment?.startedAt) return 'Not started';
		const start = new Date(experiment.startedAt);
		const end = experiment.completedAt ? new Date(experiment.completedAt) : new Date();
		const diffMs = end - start;
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
		if (diffHours > 0) return `${diffHours}h`;
		const diffMins = Math.floor(diffMs / (1000 * 60));
		return `${diffMins}m`;
	}

	function getVariantCtr(variant) {
		if (!variant.impressions || variant.impressions === 0) return '0.00';
		return ((variant.clicks || 0) / variant.impressions * 100).toFixed(2);
	}

	// ============== Actions ==============

	async function handleStart() {
		try {
			await startExperimentAction(uid);
			toast.set({ message: 'Experiment started!', type: 'success' });
		} catch (err) {
			toast.set({ message: err.message || 'Failed to start experiment', type: 'error' });
		}
	}

	async function handlePause() {
		try {
			await pauseExperimentAction(uid);
			toast.set({ message: 'Experiment paused', type: 'success' });
		} catch (err) {
			toast.set({ message: err.message || 'Failed to pause experiment', type: 'error' });
		}
	}

	async function handleComplete() {
		if (!selectedWinner) {
			toast.set({ message: 'Please select a winning variant', type: 'warning' });
			return;
		}
		try {
			await completeExperimentAction(uid, selectedWinner);
			showDeclareWinner = false;
			selectedWinner = null;
			toast.set({ message: 'Experiment completed! Winner declared.', type: 'success' });
		} catch (err) {
			toast.set({ message: err.message || 'Failed to complete experiment', type: 'error' });
		}
	}

	async function handleDelete() {
		try {
			await deleteExperimentAction(uid);
			toast.set({ message: 'Experiment deleted', type: 'success' });
			goto('/dashboard/experiments');
		} catch (err) {
			toast.set({ message: err.message || 'Failed to delete experiment', type: 'error' });
		}
	}

	async function handleSaveEdit() {
		try {
			await updateExperimentAction(uid, {
				name: editName,
				hypothesis: editHypothesis
			});
			showEditMode = false;
			toast.set({ message: 'Experiment updated', type: 'success' });
		} catch (err) {
			toast.set({ message: err.message || 'Failed to update experiment', type: 'error' });
		}
	}

	function openEditMode() {
		editName = exp?.name || '';
		editHypothesis = exp?.hypothesis || '';
		showEditMode = true;
	}

	function handleDuplicate() {
		goto(`/dashboard/experiments/create?duplicate=${uid}`);
	}

	// ============== Lifecycle ==============

	onMount(async () => {
		unsubExperiment = experiment.subscribe((val) => {
			if (val && val.uid) {
				exp = val;
			}
		});

		unsubAnalytics = experimentAnalytics.subscribe((val) => {
			analytics = val;
		});

		try {
			await getExperimentAction(uid);
			await getExperimentAnalyticsAction(uid);
		} catch (err) {
			console.error('Failed to load experiment:', err);
		} finally {
			isLoading = false;
		}

		// Auto-refresh analytics every 30s for running experiments
		refreshInterval = setInterval(async () => {
			if (exp?.status === 'running') {
				await getExperimentAnalyticsAction(uid);
			}
		}, 30000);
	});

	onDestroy(() => {
		unsubExperiment();
		unsubAnalytics();
		if (refreshInterval) clearInterval(refreshInterval);
	});
</script>

<div class="min-h-full pb-12">
	<!-- Loading State -->
	{#if isLoading}
		<div class="flex flex-col items-center justify-center min-h-[60vh]">
			<Loader size="8" show={true} />
			<p class="text-xs font-black uppercase tracking-widest text-gray-400 mt-4 animate-pulse">
				Loading Experiment...
			</p>
		</div>

	<!-- Error / Not Found -->
	{:else if !exp || !exp.uid}
		<div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
			<div class="w-20 h-20 bg-gray-100 border-[3px] border-gray-900 rounded-xl flex items-center justify-center mb-6 shadow-[6px_6px_0_0_#1f2937]">
				<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Experiment Not Found</h2>
			<p class="text-sm text-gray-500 mb-6">This experiment may have been deleted or you don't have access.</p>
			<a
				href="/dashboard/experiments"
				class="px-6 py-3 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-xs border-[2px] border-gray-900 rounded-lg shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				Back to Experiments
			</a>
		</div>

	<!-- Main Content -->
	{:else}
		<div class="space-y-8">

			<!-- ==================== HEADER ==================== -->
			<div>
				<!-- Back Link -->
				<a
					href="/dashboard/experiments"
					class="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
				>
					<svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Back to Experiments
				</a>

				<div class="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
					<!-- Title + Badges -->
					<div class="flex-1 min-w-0">
						{#if showEditMode}
							<div class="space-y-4 max-w-xl">
								<div>
									<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
										Experiment Name
									</label>
									<input
										type="text"
										bind:value={editName}
										class="w-full px-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl text-lg font-black text-gray-900 focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480]"
									/>
								</div>
								<div>
									<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
										Hypothesis
									</label>
									<textarea
										bind:value={editHypothesis}
										rows="3"
										class="w-full px-4 py-3 bg-white border-[3px] border-gray-900 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] resize-none"
									></textarea>
								</div>
								<div class="flex items-center gap-3">
									<button
										on:click={handleSaveEdit}
										class="px-5 py-2 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-xs border-[2px] border-gray-900 rounded-lg shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									>
										Save Changes
									</button>
									<button
										on:click={() => showEditMode = false}
										class="px-5 py-2 bg-white text-gray-900 font-black uppercase tracking-widest text-xs border-[2px] border-gray-900 rounded-lg shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
									>
										Cancel
									</button>
								</div>
							</div>
						{:else}
							<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-3 truncate">
								{exp.name}
							</h1>
							<div class="flex flex-wrap items-center gap-3">
								<!-- Type Badge -->
								<span class="px-3 py-1 rounded-lg text-xs font-black uppercase border-[2px] {typeColors[exp.type] || 'bg-gray-100 text-gray-700 border-gray-700'}">
									{typeLabels[exp.type] || exp.type}
								</span>
								<!-- Status Badge -->
								<span class="px-3 py-1 rounded-lg text-xs font-black uppercase border-[2px] {statusColors[exp.status] || 'bg-gray-100 text-gray-700 border-gray-700'} flex items-center gap-2">
									{#if exp.status === 'running'}
										<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
									{/if}
									{exp.status}
								</span>
								{#if exp.hypothesis}
									<span class="text-sm text-gray-500 italic hidden md:inline">
										"{exp.hypothesis}"
									</span>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Action Buttons -->
					{#if !showEditMode}
						<div class="flex flex-wrap items-center gap-3 shrink-0">
							<!-- Start / Pause -->
							{#if exp.status === 'draft' || exp.status === 'paused'}
								<button
									on:click={handleStart}
									class="px-4 py-2.5 bg-[#4ade80] text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Start
								</button>
							{/if}
							{#if exp.status === 'running'}
								<button
									on:click={handlePause}
									class="px-4 py-2.5 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Pause
								</button>
							{/if}

							<!-- Complete (if running) -->
							{#if exp.status === 'running'}
								<button
									on:click={() => showDeclareWinner = true}
									class="px-4 py-2.5 bg-[#60a5fa] text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									Complete
								</button>
							{/if}

							<!-- Edit (draft or paused) -->
							{#if exp.status === 'draft' || exp.status === 'paused'}
								<button
									on:click={() => goto(`/dashboard/experiments/create?edit=${uid}`)}
									class="px-4 py-2.5 bg-white text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
									Edit
								</button>
							{/if}

							<!-- Duplicate -->
							<button
								on:click={handleDuplicate}
								class="px-4 py-2.5 bg-white text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
								</svg>
								Duplicate
							</button>

							<!-- Delete -->
							<button
								on:click={() => showDeleteConfirm = true}
								class="px-4 py-2.5 bg-[#ff6b6b] text-white font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
								Delete
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- ==================== STATS ROW ==================== -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
				<!-- Total Impressions -->
				<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden flex flex-col">
					<div class="px-5 py-3 border-b-[3px] border-gray-900 bg-[#7c3aed]/10 flex items-center justify-between pointer-events-none relative">
						<div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')] mix-blend-overlay"></div>
						<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest relative z-10">Impressions</span>
						<svg class="w-5 h-5 text-gray-900 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
					</div>
					<div class="p-5 flex flex-col justify-center flex-1">
						<div class="text-4xl font-black text-gray-900 tracking-tighter tabular-nums">{totalImpressions.toLocaleString()}</div>
						<div class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-2">Total views served</div>
					</div>
				</div>

				<!-- Total Clicks -->
				<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden flex flex-col">
					<div class="px-5 py-3 border-b-[3px] border-gray-900 bg-[#3b82f6]/10 flex items-center justify-between pointer-events-none relative">
						<div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')] mix-blend-overlay"></div>
						<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest relative z-10">Clicks</span>
						<svg class="w-5 h-5 text-gray-900 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
						</svg>
					</div>
					<div class="p-5 flex flex-col justify-center flex-1">
						<div class="text-4xl font-black text-gray-900 tracking-tighter tabular-nums">{totalClicks.toLocaleString()}</div>
						<div class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-2">
							{isClickGoal ? 'Click-through actions' : 'Tracked interactions'}
						</div>
					</div>
				</div>

				<!-- Click Rate -->
				<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden flex flex-col">
					<div class="px-5 py-3 border-b-[3px] border-gray-900 bg-[#10b981]/10 flex items-center justify-between pointer-events-none relative">
						<div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')] mix-blend-overlay"></div>
						<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest relative z-10">Click Rate</span>
						<svg class="w-5 h-5 text-gray-900 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
					</div>
					<div class="p-5 flex flex-col justify-center flex-1">
						<div class="text-4xl font-black text-gray-900 tracking-tighter tabular-nums">{clickRate}%</div>
						<div class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-2">Clicks / Impressions</div>
					</div>
				</div>

				<!-- Duration / Status -->
				<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] overflow-hidden flex flex-col">
					<div class="px-5 py-3 border-b-[3px] border-gray-900 bg-[#f59e0b]/10 flex items-center justify-between pointer-events-none relative">
						<div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4=')] mix-blend-overlay"></div>
						<span class="text-[10px] font-black text-gray-900 uppercase tracking-widest relative z-10">Duration</span>
						<svg class="w-5 h-5 text-gray-900 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="p-5 flex flex-col justify-center flex-1">
						<div class="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">{runningDuration}</div>
						<div class="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-2">
							{#if exp.status === 'running'}
								Running since <span class="text-gray-900">{formatRelativeDate(exp.startedAt)}</span>
							{:else if exp.status === 'completed'}
								Completed <span class="text-gray-900">{formatRelativeDate(exp.completedAt)}</span>
							{:else}
								{exp.status === 'draft' ? 'Not yet started' : 'Currently paused'}
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- ==================== VARIANT CARDS ==================== -->
			<div>
				<div class="flex items-center gap-3 mb-6">
					<h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Variants</h2>
					<span class="px-3 py-1 bg-[#ffc480] text-gray-900 border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] text-xs font-black rounded-lg uppercase">
						{variants.length}
					</span>
				</div>

				{#if variants.length === 0}
					<div class="bg-white p-8 rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] text-center">
						<p class="text-gray-500 font-bold uppercase tracking-widest text-xs">No variants configured yet.</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{#each variants as variant, idx}
							<div class="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden {variant.isWinner ? 'shadow-[8px_8px_0_0_#ffc480] -translate-y-1' : 'shadow-[6px_6px_0_0_#1f2937] hover:shadow-[8px_8px_0_0_#1f2937] hover:-translate-y-1'} transition-all duration-200">
								<!-- Variant Header -->
								<div class="px-5 py-4 border-b-[3px] border-gray-900 {variant.isWinner ? 'bg-[#ffc480]/20' : 'bg-[#FFFDF8]'} flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
									<div class="flex items-center gap-4 min-w-0 w-full sm:w-auto">
										<!-- Variant Index Badge -->
										<div class="w-10 h-10 bg-gray-900 text-white rounded-xl border-[2px] border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-sm font-black shrink-0 relative overflow-hidden group">
											<div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
											{String.fromCharCode(65 + idx)}
										</div>
										<div class="min-w-0">
											<h3 class="font-black text-gray-900 text-base uppercase tracking-wide truncate">
												{variant.name || `Variant ${String.fromCharCode(65 + idx)}`}
											</h3>
											<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">
												Weight: {variant.weight || 0}%
											</span>
										</div>
									</div>
									<div class="flex items-center gap-2 shrink-0">
										{#if variant.isWinner}
											<span class="px-3 py-1.5 rounded-lg text-xs font-black uppercase border-[3px] bg-[#ffc480] text-gray-900 border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center gap-1">
												<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
													<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
												</svg>
												Winner
											</span>
										{/if}
										{#if variant.isDefault}
											<span class="px-3 py-1.5 rounded-lg text-xs font-black uppercase border-[3px] border-gray-900 bg-gray-100 text-gray-900 shadow-[2px_2px_0_0_#1f2937]">
												Default
											</span>
										{/if}
									</div>
								</div>

								<!-- Variant Body -->
								<div class="p-6 space-y-5 bg-white">
									<!-- Thumbnail Preview -->
									{#if variant.preRenderedUrl}
										<div class="w-full h-40 bg-gray-100 border-[3px] border-gray-900 rounded-xl overflow-hidden shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)] relative group">
											<img
												src={variant.preRenderedUrl}
												alt="{variant.name || 'Variant'} preview"
												class="w-full h-full object-contain p-2"
											/>
											<div class="absolute inset-0 bg-gray-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<button class="px-4 py-2 bg-white text-gray-900 font-black uppercase tracking-widest text-[10px] border-[2px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
													Preview
												</button>
											</div>
										</div>
									{/if}

									<!-- Stats Grid Inner -->
									<div class="grid grid-cols-2 gap-4">
										<!-- Impressions Block -->
										<div>
											<div class="flex items-center justify-between mb-2">
												<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Impressions</span>
												<span class="text-sm font-black text-gray-900">{(variant.impressions || 0).toLocaleString()}</span>
											</div>
											<div class="w-full bg-gray-100 h-3 rounded overflow-hidden border-[2px] border-gray-900">
												<div
													class="h-full bg-[#ffc480] border-r-[2px] border-gray-900 transition-all duration-500"
													style="width: {getBarWidth(variant.impressions || 0, maxImpressions)}%"
												></div>
											</div>
										</div>

										<!-- Clicks Block -->
										{#if isClickGoal}
											<div>
												<div class="flex items-center justify-between mb-2">
													<span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Clicks</span>
													<span class="text-sm font-black text-gray-900">{(variant.clicks || 0).toLocaleString()}</span>
												</div>
												<div class="w-full bg-gray-100 h-3 rounded overflow-hidden border-[2px] border-gray-900">
													<div
														class="h-full bg-[#fde047] border-r-[2px] border-gray-900 transition-all duration-500"
														style="width: {getBarWidth(variant.clicks || 0, Math.max(...variants.map(v => v.clicks || 0), 1))}%"
													></div>
												</div>
											</div>
										{/if}
									</div>

									<!-- CTR Footer -->
									<div class="flex items-center justify-between pt-4 border-t-[3px] border-gray-900 border-dashed">
										<span class="text-xs font-black text-gray-500 uppercase tracking-widest">Conversion Rate</span>
										<div class="px-3 py-1 bg-[#10b981]/10 rounded border-[2px] border-gray-900 text-gray-900 font-black tabular-nums">
											{getVariantCtr(variant)}%
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- ==================== SMART URL SECTION ==================== -->
			{#if exp.slug}
				<div class="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_0_#1f2937]">
					<div class="px-6 py-4 border-b-[3px] border-gray-900 bg-[#FFFDF8]">
						<h2 class="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
							</svg>
							Integration Details
						</h2>
					</div>
					<div class="p-6 space-y-6">
						<!-- Public URL -->
						<div>
							<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
								Public URL
							</label>
							<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
								<div class="flex-1 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl font-mono text-sm font-bold text-gray-900 truncate shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
									https://{publicUrl}
								</div>
								<button
									on:click={() => copyToClipboard(`https://${publicUrl}`, 'URL copied!')}
									class="px-5 py-3.5 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all shrink-0"
								>
									Copy URL
								</button>
							</div>
						</div>

						<!-- Tracking Pixel -->
						{#if exp.goalConfig?.type === 'click_through' || exp.goalConfig?.trackPixel}
							<div>
								<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
									Tracking Pixel URL
								</label>
								<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
									<div class="flex-1 px-4 py-3 bg-gray-50 border-[3px] border-gray-900 rounded-xl font-mono text-xs font-bold text-gray-700 truncate shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										https://pictify.io/s/{exp.slug}/pixel.gif
									</div>
									<button
										on:click={() => copyToClipboard(`https://pictify.io/s/${exp.slug}/pixel.gif`, 'Pixel URL copied!')}
										class="px-5 py-3.5 bg-white text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all shrink-0"
									>
										Copy Pixel
									</button>
								</div>
							</div>
						{/if}

						<!-- Embed Code -->
						<div>
							<label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
								Embed HTML
							</label>
							<div class="relative group">
								<pre class="px-5 py-4 bg-gray-900 text-[#4ade80] border-[3px] border-gray-900 rounded-xl font-mono text-sm overflow-x-auto shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.5)]">{embedCode}</pre>
								<button
									on:click={() => copyToClipboard(embedCode, 'Embed code copied!')}
									class="absolute top-3 right-3 px-4 py-2 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-[10px] border-[3px] border-gray-900 rounded-lg shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all opacity-0 group-hover:opacity-100"
								>
									Copy HTML
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- ==================== ANALYTICS SECTION ==================== -->
			{#if exp.status === 'running' || exp.status === 'completed'}
				<div class="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_0_#1f2937]">
					<div class="px-6 py-4 border-b-[3px] border-gray-900 bg-[#FFFDF8] flex items-center justify-between">
						<h2 class="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
							Performance Analytics
						</h2>
						{#if exp.status === 'running'}
							<span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border-[2px] border-gray-200">
								<span class="w-2.5 h-2.5 bg-[#4ade80] border-[2px] border-gray-900 rounded-full animate-pulse shadow-[1px_1px_0_0_#000]"></span>
								Live - Auto-refreshing
							</span>
						{/if}
					</div>

					<div class="p-6 space-y-8">
						<!-- Impressions Comparison Bar Chart -->
						<div>
							<h3 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
								<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
								Impressions by Variant
							</h3>
							<div class="space-y-4">
								{#each variants as variant, idx}
									<div class="flex items-center gap-4 group">
										<div class="w-24 shrink-0 flex items-center justify-end gap-2 text-right">
											{#if variant.isWinner}
												<svg class="w-3.5 h-3.5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
											{/if}
											<span class="text-xs font-black text-gray-900 uppercase">
												{variant.name || `Variant ${String.fromCharCode(65 + idx)}`}
											</span>
										</div>
										<div class="flex-1 bg-gray-100 h-10 rounded-xl overflow-hidden border-[3px] border-gray-900 relative shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
											<div
												class="h-full transition-all duration-700 ease-out flex items-center {variant.isWinner ? 'bg-[#ffc480]' : idx % 2 === 0 ? 'bg-[#60a5fa]' : 'bg-[#c084fc]'} border-r-[3px] border-gray-900"
												style="width: {getBarWidth(variant.impressions || 0, maxImpressions)}%"
											>
												{#if (variant.impressions || 0) > 0}
													<span class="ml-3 text-[10px] font-black text-gray-900 whitespace-nowrap bg-white/50 px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">
														{(variant.impressions || 0).toLocaleString()}
													</span>
												{/if}
											</div>
										</div>
										<div class="w-16 text-right shrink-0">
											<span class="text-xs font-black text-gray-500 group-hover:text-gray-900 transition-colors">
												{Math.round((variant.impressions / totalImpressions) * 100) || 0}%
											</span>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Click-Through Comparison (if applicable) -->
						{#if isClickGoal}
							<div class="pt-6 border-t-[3px] border-gray-900 border-dashed">
								<h3 class="text-xs font-black text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
									<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
									Clicks by Variant
								</h3>
								<div class="space-y-4">
									{#each variants as variant, idx}
										{@const maxClicks = Math.max(...variants.map(v => v.clicks || 0), 1)}
										<div class="flex items-center gap-4 group">
											<div class="w-24 shrink-0 flex items-center justify-end gap-2 text-right">
												{#if variant.isWinner}
													<svg class="w-3.5 h-3.5 text-[#f59e0b]" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
												{/if}
												<span class="text-xs font-black text-gray-900 uppercase">
													{variant.name || `Variant ${String.fromCharCode(65 + idx)}`}
												</span>
											</div>
											<div class="flex-1 bg-gray-100 h-10 rounded-xl overflow-hidden border-[3px] border-gray-900 relative shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
												<div
													class="h-full transition-all duration-700 ease-out flex items-center {variant.isWinner ? 'bg-[#ffc480]' : 'bg-[#4ade80]'} border-r-[3px] border-gray-900"
													style="width: {getBarWidth(variant.clicks || 0, maxClicks)}%"
												>
													{#if (variant.clicks || 0) > 0}
														<span class="ml-3 text-[10px] font-black text-gray-900 whitespace-nowrap bg-white/50 px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">
															{(variant.clicks || 0).toLocaleString()}
														</span>
													{/if}
												</div>
											</div>
											<div class="w-16 text-right shrink-0">
												<span class="text-xs font-black text-gray-500 group-hover:text-gray-900 transition-colors">
													{getVariantCtr(variant)}% CTR
												</span>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Significance Status -->
						{#if analytics?.significance}
							<div class="pt-6 border-t-[3px] border-gray-900 border-dashed">
								<div class="flex items-center gap-4 p-5 rounded-xl border-[3px] {analytics.significance.isSignificant ? 'border-gray-900 bg-[#4ade80]/10 shadow-[6px_6px_0_0_#1f2937]' : 'border-gray-900 bg-gray-50 shadow-[4px_4px_0_0_#e5e7eb]'} transition-all">
									<div class="w-12 h-12 rounded-xl border-[3px] border-gray-900 flex items-center justify-center shrink-0 {analytics.significance.isSignificant ? 'bg-[#4ade80] shadow-[2px_2px_0_0_#000]' : 'bg-gray-200'}">
										{#if analytics.significance.isSignificant}
											<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
											</svg>
										{:else}
											<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										{/if}
									</div>
									<div>
										<h4 class="text-sm font-black text-gray-900 uppercase tracking-wide">
											{analytics.significance.isSignificant ? 'Statistically Significant' : 'Not Yet Significant'}
										</h4>
										<p class="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
											{#if analytics.significance.isSignificant}
												Confidence level: {((analytics.significance.confidence || 0) * 100).toFixed(1)}%
											{:else}
												Need more data. Current confidence: {((analytics.significance.confidence || 0) * 100).toFixed(1)}%
											{/if}
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- ==================== SETTINGS SECTION (Collapsible) ==================== -->
			<div class="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[6px_6px_0_0_#1f2937]">
				<button
					on:click={() => showSettings = !showSettings}
					class="w-full px-6 py-4 border-b-[3px] border-gray-900 bg-[#FFFDF8] flex items-center justify-between hover:bg-[#FFF8EA] transition-colors text-left group"
				>
					<h2 class="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Experiment Settings
					</h2>
					<div class="w-8 h-8 rounded-lg border-[2px] border-gray-900 bg-white flex items-center justify-center shadow-[2px_2px_0_0_#1f2937] group-hover:shadow-[1px_1px_0_0_#1f2937] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
						<svg
							class="w-5 h-5 text-gray-900 transition-transform duration-300 {showSettings ? 'rotate-180' : ''}"
							fill="none" stroke="currentColor" viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				</button>

				{#if showSettings}
					<div class="p-6 space-y-8 bg-white">
						<!-- Goal Configuration -->
						<div>
							<h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b-2 border-gray-100 pb-2">Goal Configuration</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
									<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Goal Type</span>
									<span class="text-sm font-black text-gray-900 uppercase">
										{exp.goalConfig?.type?.replace(/_/g, ' ') || 'Not set'}
									</span>
								</div>
								{#if exp.goalConfig?.destinationUrl}
									<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Destination URL</span>
										<span class="text-xs font-mono font-bold text-gray-700 truncate block">{exp.goalConfig.destinationUrl}</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Statistical Configuration -->
						<div>
							<h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b-2 border-gray-100 pb-2">Statistical Configuration</h3>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
									<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Min Sample Size</span>
									<span class="text-lg font-black text-gray-900 tabular-nums">
										{(exp.minimumSampleSize || 0).toLocaleString()}
									</span>
								</div>
								<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
									<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Confidence Threshold</span>
									<span class="text-lg font-black text-gray-900 tabular-nums">
										{((exp.confidenceThreshold || 0) * 100).toFixed(0)}%
									</span>
								</div>
								{#if exp.hypothesis}
									<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)] sm:col-span-3 lg:col-span-1">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Hypothesis</span>
										<span class="text-sm font-bold text-gray-700 italic leading-relaxed">"{exp.hypothesis}"</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Bandit Config (if applicable) -->
						{#if exp.type === 'bandit' && exp.banditConfig}
							<div>
								<h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b-2 border-gray-100 pb-2">Auto-Optimize Configuration</h3>
								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div class="p-4 bg-emerald-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Algorithm</span>
										<span class="text-sm font-black text-emerald-900 uppercase">
											{exp.banditConfig.algorithm?.replace(/_/g, ' ') || 'N/A'}
										</span>
									</div>
									<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Warmup Impressions</span>
										<span class="text-lg font-black text-gray-900 tabular-nums">
											{exp.banditConfig.warmupImpressions || 0}
										</span>
									</div>
									<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Recompute Interval</span>
										<span class="text-lg font-black text-gray-900 tabular-nums">
											{exp.banditConfig.recomputeIntervalMinutes || 0} <span class="text-sm text-gray-500 uppercase">min</span>
										</span>
									</div>
								</div>
							</div>
						{/if}

						<!-- Output Configuration -->
						<div>
							<h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b-2 border-gray-100 pb-2">Output Configuration</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)] flex items-center justify-between">
									<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Format</span>
									<span class="px-2 py-1 bg-gray-200 border-[2px] border-gray-900 rounded text-xs font-black text-gray-900 uppercase tracking-widest">{exp.outputConfig?.format || 'PNG'}</span>
								</div>
								<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)] flex items-center justify-between">
									<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Quality</span>
									<span class="text-lg font-black text-gray-900 tabular-nums">{exp.outputConfig?.quality || 90}%</span>
								</div>
							</div>
						</div>

						<!-- Dates -->
						<div>
							<h3 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b-2 border-gray-100 pb-2">Timeline</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
									<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Created</span>
									<span class="text-xs font-bold text-gray-700">{exp.createdAt ? formatRelativeDate(exp.createdAt) : 'N/A'}</span>
								</div>
								<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
									<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Updated</span>
									<span class="text-xs font-bold text-gray-700">{exp.updatedAt ? formatRelativeDate(exp.updatedAt) : 'N/A'}</span>
								</div>
								{#if exp.startedAt}
									<div class="p-4 bg-[#60a5fa]/10 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Started</span>
										<span class="text-xs font-bold text-gray-900">{formatRelativeDate(exp.startedAt)}</span>
									</div>
								{/if}
								{#if exp.completedAt}
									<div class="p-4 bg-[#4ade80]/10 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Completed</span>
										<span class="text-xs font-bold text-gray-900">{formatRelativeDate(exp.completedAt)}</span>
									</div>
								{/if}
								{#if exp.startAt}
									<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Scheduled Start</span>
										<span class="text-xs font-bold text-gray-700">{formatRelativeDate(exp.startAt)}</span>
									</div>
								{/if}
								{#if exp.endAt}
									<div class="p-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)]">
										<span class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Scheduled End</span>
										<span class="text-xs font-bold text-gray-700">{formatRelativeDate(exp.endAt)}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- ==================== DECLARE WINNER MODAL ==================== -->
{#if showDeclareWinner}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
		on:click={() => { showDeclareWinner = false; selectedWinner = null; }}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div
			class="bg-white rounded-2xl border-[4px] border-gray-900 shadow-[16px_16px_0_0_#1f2937] max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
			on:click|stopPropagation
		>
			<!-- Modal Header -->
			<div class="bg-white border-b-[4px] border-gray-900 px-6 py-5 flex items-center justify-between shrink-0">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
							<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
						</svg>
					</div>
					<div>
						<h2 class="font-black text-xl text-gray-900 uppercase tracking-tight">Declare Winner</h2>
						<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest">End Experiment</p>
					</div>
				</div>
				<button
					class="w-10 h-10 bg-white border-[3px] border-gray-900 hover:bg-gray-100 rounded-xl shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center text-gray-900"
					on:click={() => { showDeclareWinner = false; selectedWinner = null; }}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6 overflow-y-auto space-y-6 bg-[#FFFDF8]">
				<p class="text-sm font-bold text-gray-700 bg-amber-50 border-[2px] border-amber-200 p-4 rounded-xl">
					Select the winning variant. This will complete the experiment and route all future traffic to the winner, permanently.
				</p>

				<div class="grid grid-cols-1 gap-4">
					{#each variants as variant, idx}
						<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
						<div
							class="p-4 rounded-xl border-[3px] cursor-pointer transition-all {selectedWinner === (variant.uid || variant.id || idx) ? 'border-gray-900 bg-[#ffc480]/20 shadow-[6px_6px_0_0_#1f2937]' : 'border-gray-900 bg-white shadow-[card] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#1f2937]'}"
							on:click={() => selectedWinner = variant.uid || variant.id || idx}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-4">
									<!-- Selection Indicator -->
									<div class="w-8 h-8 rounded-full border-[3px] border-gray-900 flex items-center justify-center shrink-0 {selectedWinner === (variant.uid || variant.id || idx) ? 'bg-[#ffc480] shadow-[inset_2px_2px_0_0_rgba(255,255,255,0.7)]' : 'bg-gray-100 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)]'}">
										{#if selectedWinner === (variant.uid || variant.id || idx)}
											<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
											</svg>
										{/if}
									</div>
									<div>
										<h4 class="text-base font-black text-gray-900 uppercase">
											{variant.name || `Variant ${String.fromCharCode(65 + idx)}`}
										</h4>
										<span class="text-xs font-black text-gray-500 uppercase tracking-widest mt-1 block">
											{(variant.impressions || 0).toLocaleString()} imp | CTR: {getVariantCtr(variant)}%
										</span>
									</div>
								</div>

								{#if variant.preRenderedUrl}
									<div class="w-16 h-16 bg-gray-100 border-[3px] border-gray-900 shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.05)] rounded-xl overflow-hidden shrink-0">
										<img src={variant.preRenderedUrl} alt="" class="w-full h-full object-contain p-1" />
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="p-6 bg-white border-t-[4px] border-gray-900 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 shrink-0">
				<button
					on:click={() => { showDeclareWinner = false; selectedWinner = null; }}
					class="w-full sm:w-auto px-6 py-3.5 bg-white text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Cancel
				</button>
				<button
					on:click={handleComplete}
					disabled={!selectedWinner}
					class="w-full sm:w-auto px-6 py-3.5 bg-[#f59e0b] text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0_0_#1f2937] disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
					</svg>
					Declare Winner
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
{#if showDeleteConfirm}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
		on:click={() => showDeleteConfirm = false}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div
			class="bg-white rounded-2xl border-[4px] border-gray-900 shadow-[16px_16px_0_0_#1f2937] max-w-md w-full overflow-hidden flex flex-col"
			on:click|stopPropagation
		>
			<!-- Modal Header -->
			<div class="bg-white border-b-[4px] border-gray-900 px-6 py-5 flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 bg-[#ef4444] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</div>
					<div>
						<h2 class="font-black text-xl text-gray-900 uppercase tracking-tight">Confirm Deletion</h2>
						<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Destructive Action</p>
					</div>
				</div>
				<button
					class="w-10 h-10 bg-white border-[3px] border-gray-900 hover:bg-gray-100 rounded-xl shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center text-gray-900"
					on:click={() => showDeleteConfirm = false}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Modal Body -->
			<div class="p-6 bg-[#FFFDF8]">
				<p class="text-base font-bold text-gray-800 leading-relaxed mb-4">
					Are you absolutely sure you want to delete <strong class="font-black text-red-600 bg-red-100 px-1 rounded">{exp?.name}</strong>?
				</p>
				<p class="text-sm font-bold text-gray-500 border-l-[4px] border-red-500 pl-4 py-1">
					This action cannot be undone and will erase all data, analytics, and associated URLs.
				</p>
			</div>

			<!-- Modal Footer -->
			<div class="p-6 bg-white border-t-[4px] border-gray-900 flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
				<button
					on:click={() => showDeleteConfirm = false}
					class="w-full sm:w-auto px-6 py-3.5 bg-white text-gray-900 font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Cancel
				</button>
				<button
					on:click={handleDelete}
					class="w-full sm:w-auto px-6 py-3.5 bg-[#ef4444] text-white font-black uppercase tracking-widest text-xs border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
					</svg>
					Delete Permanently
				</button>
			</div>
		</div>
	</div>
{/if}

<Toast />
