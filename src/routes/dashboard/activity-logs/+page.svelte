<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		auditLogs,
		auditSummary,
		fetchLogs,
		fetchSummary,
		updateFilters,
		clearFilters,
		goToPage,
		exportLogs
	} from '../../../store/audit.store';
	import Loader from '$lib/components/Loader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../store/toast.store';
	import { formatDateTime } from '$lib/utils/format.js';
	import { analytics } from '$lib/analytics.js';

	let logs = [];
	let summary = {};
	let isLoading = true;
	let isSummaryLoading = true;
	let error = null;
	let total = 0;
	let limit = 50;
	let offset = 0;
	let hasMore = false;

	// Filters
	let category = '';
	let status = '';
	let startDate = '';
	let endDate = '';

	// UI State
	let showFilters = false;
	let showExportMenu = false;
	let selectedLog = null;
	let showLogDetail = false;

	let unsubscribeLogs = () => {};
	let unsubscribeSummary = () => {};

	// Category options
	const categories = [
		{ value: '', label: 'All Categories' },
		{ value: 'image', label: 'Images' },
		{ value: 'gif', label: 'GIFs' },
		{ value: 'pdf', label: 'PDFs' },
		{ value: 'template', label: 'Templates' },
		{ value: 'batch', label: 'Batch Jobs' },
		{ value: 'auth', label: 'Authentication' },
		{ value: 'api', label: 'API' },
		{ value: 'connector', label: 'Connectors' },
		{ value: 'webhook', label: 'Webhooks' },
		{ value: 'other', label: 'Other' }
	];

	// Status options
	const statuses = [
		{ value: '', label: 'All Statuses' },
		{ value: 'success', label: 'Success' },
		{ value: 'failure', label: 'Failed' },
		{ value: 'pending', label: 'Pending' }
	];

	// Configuration for icons and colors
	const categoryConfig = {
		image: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />',
			color: 'bg-blue-100 text-blue-800 border-blue-800'
		},
		gif: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />',
			color: 'bg-purple-100 text-purple-800 border-purple-800'
		},
		template: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
			color: 'bg-green-100 text-green-800 border-green-800'
		},
		batch: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />',
			color: 'bg-[#ffc480] text-gray-900 border-gray-900'
		},
		auth: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />',
			color: 'bg-gray-100 text-gray-800 border-gray-800'
		},
		api: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />',
			color: 'bg-yellow-100 text-yellow-800 border-yellow-800'
		},
		pdf: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />',
			color: 'bg-red-100 text-red-800 border-red-800'
		},
		connector: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />',
			color: 'bg-indigo-100 text-indigo-800 border-indigo-800'
		},
		webhook: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />',
			color: 'bg-teal-100 text-teal-800 border-teal-800'
		},
		other: {
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />',
			color: 'bg-gray-100 text-gray-800 border-gray-800'
		}
	};

	const statusConfig = {
		success: { color: 'bg-[#4ade80]/20 text-[#15803d] border-[#15803d]', dot: 'bg-[#15803d]' },
		failure: { color: 'bg-[#ff6b6b]/20 text-[#b91c1c] border-[#b91c1c]', dot: 'bg-[#b91c1c]' },
		pending: { color: 'bg-[#ffc480]/20 text-[#b45309] border-[#b45309]', dot: 'bg-[#b45309]' }
	};

	onMount(async () => {
		// Track page view
		analytics.trackDashboardPage({ page_name: 'activity_logs' });

		unsubscribeLogs = auditLogs.subscribe((state) => {
			logs = state.logs || [];
			total = state.total || 0;
			limit = state.limit || 50;
			offset = state.offset || 0;
			hasMore = state.hasMore || false;
			isLoading = state.isLoading;
			error = state.error;
		});

		unsubscribeSummary = auditSummary.subscribe((state) => {
			summary = state;
			isSummaryLoading = state.isLoading;
		});

		await Promise.all([fetchLogs(), fetchSummary()]);
	});

	onDestroy(() => {
		unsubscribeLogs();
		unsubscribeSummary();
	});

	async function handleFilterChange() {
		await updateFilters({ category, status, startDate, endDate });
	}

	async function handleClearFilters() {
		category = '';
		status = '';
		startDate = '';
		endDate = '';
		await clearFilters();
	}

	async function handleExport(format) {
		try {
			const result = await exportLogs({ format });
			const blob = new Blob([format === 'csv' ? result : JSON.stringify(result, null, 2)], {
				type: format === 'csv' ? 'text/csv' : 'application/json'
			});
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.set({
				message: `Exported as ${format.toUpperCase()}`,
				type: 'success',
				duration: 2000
			});
		} catch (err) {
			toast.set({ message: 'Export failed', type: 'error', duration: 2000 });
		}
	}

	function formatDate(dateString) {
		return formatDateTime(dateString);
	}

	function formatDuration(ms) {
		if (!ms) return '-';
		return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
	}

	$: currentPage = Math.floor(offset / limit) + 1;
	$: totalPages = Math.ceil(total / limit);

	function handleClickOutside(event) {
		if (showExportMenu && !event.target.closest('.relative')) {
			showExportMenu = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="min-h-full">
	<div>
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
			<div>
				<div
					class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3"
				>
					<span class="w-2 h-2 bg-[#ff6b6b] rounded-full animate-pulse" />
					System Monitor
				</div>
				<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
					Activity <span
						class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600"
						>Logs</span
					>
				</h1>
			</div>
			<div class="flex items-center gap-4">
				<div class="text-right hidden md:block">
					<div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Events</div>
					<div class="text-xl font-black text-gray-900 uppercase">{summary.totalLogs || 0}</div>
				</div>
			</div>
		</div>

		<!-- Summary Meter Panel -->
		{#if !isSummaryLoading && summary.totalLogs > 0}
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<div
					class="bg-white p-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
				>
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs font-black text-gray-500 uppercase tracking-widest"
							>Success Rate</span
						>
						<div class="w-2 h-2 bg-[#4ade80] rounded-full" />
					</div>
					<div class="text-3xl font-black text-gray-900">
						{Math.round(((summary.byStatus?.success || 0) / summary.totalLogs) * 100)}%
					</div>
					<div
						class="w-full bg-gray-200 h-2 mt-2 rounded-full overflow-hidden border border-gray-900"
					>
						<div
							class="h-full bg-[#4ade80]"
							style="width: {Math.round(
								((summary.byStatus?.success || 0) / summary.totalLogs) * 100
							)}%"
						/>
					</div>
				</div>

				<div
					class="bg-white p-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
				>
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs font-black text-gray-500 uppercase tracking-widest"
							>Error Rate</span
						>
						<div class="w-2 h-2 bg-[#ff6b6b] rounded-full" />
					</div>
					<div class="text-3xl font-black text-gray-900">
						{Math.round(((summary.byStatus?.failure || 0) / summary.totalLogs) * 100)}%
					</div>
					<div
						class="w-full bg-gray-200 h-2 mt-2 rounded-full overflow-hidden border border-gray-900"
					>
						<div
							class="h-full bg-[#ff6b6b]"
							style="width: {Math.round(
								((summary.byStatus?.failure || 0) / summary.totalLogs) * 100
							)}%"
						/>
					</div>
				</div>

				<div
					class="bg-white p-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
				>
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs font-black text-gray-500 uppercase tracking-widest"
							>Total Renders</span
						>
						<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/></svg
						>
					</div>
					<div class="text-3xl font-black text-gray-900">{summary.totalRenders || 0}</div>
				</div>

				<div
					class="bg-white p-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
				>
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs font-black text-gray-500 uppercase tracking-widest"
							>Integrations</span
						>
						<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/></svg
						>
					</div>
					<div class="text-3xl font-black text-gray-900">{summary.totalIntegrations || 0}</div>
				</div>
			</div>
		{/if}

		<!-- Main Control Panel -->
		<div
			class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col"
		>
			<!-- Toolbar -->
			<div
				class="p-4 border-b-[3px] border-gray-900 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center"
			>
				<div class="flex items-center gap-2 w-full sm:w-auto">
					<button
						class="px-4 py-2 bg-white border-[2px] border-gray-900 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-gray-900 hover:text-white transition-all shadow-[2px_2px_0_0_#1f2937] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-2"
						on:click={() => (showFilters = !showFilters)}
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
							/></svg
						>
						Filters
					</button>
					<div class="relative">
						<button
							class="px-4 py-2 bg-[#ffc480] border-[2px] border-gray-900 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-[#ffb356] transition-all shadow-[2px_2px_0_0_#1f2937] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-2"
							on:click={() => (showExportMenu = !showExportMenu)}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/></svg
							>
							Export
						</button>
						{#if showExportMenu}
							<div
								class="absolute top-full left-0 mt-2 w-32 bg-white border-[2px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937] z-20"
							>
								<button
									class="w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-100 border-b border-gray-100"
									on:click={() => {
										handleExport('json');
										showExportMenu = false;
									}}>JSON</button
								>
								<button
									class="w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-100"
									on:click={() => {
										handleExport('csv');
										showExportMenu = false;
									}}>CSV</button
								>
							</div>
						{/if}
					</div>
				</div>

				<!-- Pagination (Compact) -->
				{#if totalPages > 1}
					<div class="flex items-center gap-2">
						<button
							class="w-8 h-8 flex items-center justify-center border-[2px] border-gray-900 rounded bg-white hover:bg-gray-100 disabled:opacity-50"
							disabled={currentPage === 1}
							on:click={() => goToPage(currentPage - 1)}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/></svg
							>
						</button>
						<span class="text-xs font-mono font-bold text-gray-500"
							>{currentPage} / {totalPages}</span
						>
						<button
							class="w-8 h-8 flex items-center justify-center border-[2px] border-gray-900 rounded bg-white hover:bg-gray-100 disabled:opacity-50"
							disabled={currentPage === totalPages}
							on:click={() => goToPage(currentPage + 1)}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/></svg
							>
						</button>
					</div>
				{/if}
			</div>

			<!-- Filters Panel (Expandable) -->
			{#if showFilters}
				<div
					class="bg-gray-100 p-4 border-b-[3px] border-gray-900 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200"
				>
					<div>
						<label class="block">
							<span
								class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block"
								>Category</span
							>
							<select
								bind:value={category}
								on:change={handleFilterChange}
								class="w-full px-3 py-2 bg-white border-[2px] border-gray-900 rounded-lg text-xs font-bold focus:outline-none focus:shadow-[2px_2px_0_0_#ffc480]"
							>
								{#each categories as cat}<option value={cat.value}>{cat.label}</option>{/each}
							</select>
						</label>
					</div>
					<div>
						<label class="block">
							<span
								class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block"
								>Status</span
							>
							<select
								bind:value={status}
								on:change={handleFilterChange}
								class="w-full px-3 py-2 bg-white border-[2px] border-gray-900 rounded-lg text-xs font-bold focus:outline-none focus:shadow-[2px_2px_0_0_#ffc480]"
							>
								{#each statuses as stat}<option value={stat.value}>{stat.label}</option>{/each}
							</select>
						</label>
					</div>
					<div>
						<label class="block">
							<span
								class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block"
								>Start Date</span
							>
							<input
								type="date"
								bind:value={startDate}
								on:change={handleFilterChange}
								class="w-full px-3 py-2 bg-white border-[2px] border-gray-900 rounded-lg text-xs font-bold focus:outline-none focus:shadow-[2px_2px_0_0_#ffc480]"
							/>
						</label>
					</div>
					<div>
						<label class="block">
							<span
								class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block"
								>End Date</span
							>
							<input
								type="date"
								bind:value={endDate}
								on:change={handleFilterChange}
								class="w-full px-3 py-2 bg-white border-[2px] border-gray-900 rounded-lg text-xs font-bold focus:outline-none focus:shadow-[2px_2px_0_0_#ffc480]"
							/>
						</label>
					</div>
					<div class="col-span-full flex justify-end">
						<button
							class="text-xs font-bold text-[#ff6b6b] underline decoration-2 underline-offset-4 hover:text-red-600"
							on:click={handleClearFilters}>Reset Filters</button
						>
					</div>
				</div>
			{/if}

			<!-- Log Stream -->
			<div class="flex-1 overflow-x-auto bg-[#FFFDF8]">
				{#if isLoading}
					<div class="p-12 flex flex-col items-center justify-center">
						<Loader size="8" show={true} />
						<p
							class="text-xs font-black uppercase tracking-widest text-gray-400 mt-4 animate-pulse"
						>
							Fetching Stream...
						</p>
					</div>
				{:else if logs.length === 0}
					<div class="p-12 flex flex-col items-center justify-center text-center">
						<div
							class="w-16 h-16 bg-gray-100 border-[3px] border-gray-900 flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#1f2937] rounded-xl"
						>
							<svg
								class="w-8 h-8 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
								/></svg
							>
						</div>
						<p class="text-gray-900 font-black uppercase tracking-wide">No logs found</p>
						<p class="text-xs text-gray-500 mt-1">Adjust filters or make some API requests</p>
					</div>
				{:else}
					<table class="w-full min-w-[800px]">
						<thead class="bg-gray-900 text-white">
							<tr>
								<th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
									>Timestamp</th
								>
								<th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
									>Status</th
								>
								<th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
									>Action</th
								>
								<th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
									>Resource</th
								>
								<th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
									>Duration</th
								>
								<th class="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest"
									>Details</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each logs as log}
								<tr class="group hover:bg-[#ffc480]/10 transition-colors font-mono text-sm">
									<td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
										{new Date(log.createdAt).toLocaleString()}
									</td>
									<td class="px-4 py-3">
										<span
											class="inline-flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border {statusConfig[
												log.status
											]?.color || 'bg-gray-100 border-gray-300'}"
										>
											<span class="w-1.5 h-1.5 rounded-full {statusConfig[log.status]?.dot}" />
											{log.status}
										</span>
									</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											<div
												class="w-6 h-6 rounded border border-gray-900 flex items-center justify-center {categoryConfig[
													log.category
												]?.color} shadow-sm"
											>
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													{@html categoryConfig[log.category]?.icon || categoryConfig['other'].icon}
												</svg>
											</div>
											<span class="font-bold text-gray-900">{log.action}</span>
										</div>
									</td>
									<td class="px-4 py-3">
										{#if log.resourceId}
											<span
												class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200"
											>
												{log.resourceId.substring(0, 8)}...
											</span>
										{:else}
											<span class="text-gray-300">-</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-gray-600 text-xs">
										{formatDuration(log.duration)}
									</td>
									<td class="px-4 py-3 text-right">
										<button
											class="text-gray-400 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100"
											on:click={() => {
												selectedLog = log;
												showLogDetail = true;
											}}
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/></svg
											>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Log Detail Modal (System Report Style) -->
{#if showLogDetail && selectedLog}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
		on:click={() => (showLogDetail = false)}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
		<div
			class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
			on:click|stopPropagation
		>
			<!-- Modal Header -->
			<div class="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
				<div class="flex items-center gap-3">
					<div class="w-3 h-3 bg-[#ff6b6b] rounded-full border border-white/20" />
					<h2 class="font-mono font-bold text-sm uppercase tracking-widest">Event Log Details</h2>
				</div>
				<button
					class="text-gray-400 hover:text-white transition-colors"
					on:click={() => (showLogDetail = false)}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/></svg
					>
				</button>
			</div>

			<!-- Modal Content -->
			<div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
				<!-- Status Banner -->
				<div
					class="flex items-start gap-4 p-4 rounded-xl border-[2px] {statusConfig[
						selectedLog.status
					]?.color.replace('bg-', 'bg-opacity-10 bg-')}"
				>
					<div
						class="w-10 h-10 rounded-lg border-[2px] border-current flex items-center justify-center shrink-0 bg-white"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{@html categoryConfig[selectedLog.category]?.icon}
						</svg>
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-black text-lg text-gray-900 uppercase">{selectedLog.action}</h3>
							<span
								class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border {statusConfig[
									selectedLog.status
								]?.color}"
							>
								{selectedLog.status}
							</span>
						</div>
						<p class="text-sm text-gray-600">{selectedLog.description}</p>
					</div>
				</div>

				<!-- Grid Data -->
				<div class="grid grid-cols-2 gap-4">
					<div
						class="p-3 bg-white border-[2px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937]"
					>
						<span class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1"
							>Event ID</span
						>
						<code
							class="text-xs font-mono font-bold text-gray-900 block truncate"
							title={selectedLog.id || 'N/A'}>{selectedLog.id || 'N/A'}</code
						>
					</div>
					<div
						class="p-3 bg-white border-[2px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937]"
					>
						<span class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1"
							>Timestamp</span
						>
						<span class="text-xs font-mono font-bold text-gray-900 block"
							>{new Date(selectedLog.createdAt).toISOString()}</span
						>
					</div>
					{#if selectedLog.resourceId}
						<div
							class="p-3 bg-white border-[2px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937]"
						>
							<span class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1"
								>Resource ID</span
							>
							<code class="text-xs font-mono font-bold text-gray-900 block truncate"
								>{selectedLog.resourceId}</code
							>
						</div>
					{/if}
					{#if selectedLog.duration}
						<div
							class="p-3 bg-white border-[2px] border-gray-900 rounded-lg shadow-[4px_4px_0_0_#1f2937]"
						>
							<span class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1"
								>Duration</span
							>
							<span class="text-xs font-mono font-bold text-gray-900 block"
								>{formatDuration(selectedLog.duration)}</span
							>
						</div>
					{/if}
				</div>

				<!-- Error Trace -->
				{#if selectedLog.error}
					<div class="p-4 bg-red-50 border-[2px] border-[#ff6b6b] rounded-xl">
						<h4 class="text-xs font-black text-[#ff6b6b] uppercase tracking-widest mb-2">
							Error Trace
						</h4>
						<pre class="text-xs font-mono text-red-900 whitespace-pre-wrap">{selectedLog.error
								.message}</pre>
						{#if selectedLog.error.code}
							<div class="mt-2 pt-2 border-t border-red-200 text-xs text-red-700 font-mono">
								Code: {selectedLog.error.code}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Metadata Dump -->
				{#if selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0}
					<div class="bg-gray-900 rounded-xl border-[2px] border-gray-900 p-4 overflow-hidden">
						<div class="flex items-center justify-between mb-2">
							<h4 class="text-xs font-black text-[#4ade80] uppercase tracking-widest">
								Metadata Payload
							</h4>
							<span class="text-[10px] text-gray-500 font-mono">JSON</span>
						</div>
						<pre
							class="text-xs font-mono text-gray-300 whitespace-pre-wrap custom-scrollbar max-h-40 overflow-y-auto">{JSON.stringify(
								selectedLog.metadata,
								null,
								2
							)}</pre>
					</div>
				{/if}
			</div>

			<div class="p-4 bg-gray-50 border-t-[3px] border-gray-900 flex justify-end">
				<button
					class="px-6 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
					on:click={() => (showLogDetail = false)}
				>
					Close Report
				</button>
			</div>
		</div>
	</div>
{/if}

<Toast />
