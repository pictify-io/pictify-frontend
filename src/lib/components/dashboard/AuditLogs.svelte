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

	// Category icons and colors - neo-brutalist style
	const categoryConfig = {
		image: {
			iconPath:
				'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			color: 'bg-blue-100 text-blue-800 border-2 border-blue-800'
		},
		gif: {
			iconPath:
				'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
			color: 'bg-purple-100 text-purple-800 border-2 border-purple-800'
		},
		template: {
			iconPath:
				'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			color: 'bg-green-100 text-green-800 border-2 border-green-800'
		},
		batch: {
			iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
			color: 'bg-[#ffc480] text-gray-900 border-2 border-gray-900'
		},
		auth: {
			iconPath:
				'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
			color: 'bg-gray-100 text-gray-800 border-2 border-gray-800'
		},
		api: {
			iconPath:
				'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
			color: 'bg-yellow-100 text-yellow-800 border-2 border-yellow-800'
		},
		pdf: {
			iconPath:
				'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
			color: 'bg-red-100 text-red-800 border-2 border-red-800'
		},
		connector: {
			iconPath:
				'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
			color: 'bg-indigo-100 text-indigo-800 border-2 border-indigo-800'
		},
		webhook: {
			iconPath:
				'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
			color: 'bg-teal-100 text-teal-800 border-2 border-teal-800'
		},
		other: {
			iconPath:
				'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
			color: 'bg-gray-100 text-gray-800 border-2 border-gray-800'
		}
	};

	// Status colors - neo-brutalist style
	const statusConfig = {
		success: { color: 'bg-green-100 text-green-800 border-2 border-green-800', dot: 'bg-green-500' },
		failure: { color: 'bg-[#ff6b6b]/20 text-[#ff6b6b] border-2 border-[#ff6b6b]', dot: 'bg-[#ff6b6b]' },
		pending: { color: 'bg-[#ffc480]/30 text-gray-900 border-2 border-gray-900', dot: 'bg-[#ffc480]' }
	};

	onMount(async () => {
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

			if (format === 'csv') {
				// Download CSV file
				const blob = new Blob([result], { type: 'text/csv' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				// Download JSON file
				const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}

			toast.set({ message: `Audit logs exported as ${format.toUpperCase()}`, type: 'success', duration: 2000 });
		} catch (err) {
			toast.set({ message: 'Failed to export logs', type: 'error', duration: 2000 });
		}
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(ms) {
		if (!ms) return '-';
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	function openLogDetail(log) {
		selectedLog = log;
		showLogDetail = true;
	}

	function closeLogDetail() {
		selectedLog = null;
		showLogDetail = false;
	}

	// Pagination
	$: currentPage = Math.floor(offset / limit) + 1;
	$: totalPages = Math.ceil(total / limit);

	async function handlePageChange(page) {
		await goToPage(page);
	}
</script>

<section class="h-full bg-[#FFFDF8] min-h-screen">
	<div class="max-w-7xl p-4 sm:p-6 mx-auto">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Activity Logs</h1>
				<p class="text-sm text-gray-600 mt-1">
					Track and audit all your API activities and resource operations
				</p>
			</div>
			<div class="flex gap-2 mt-4 sm:mt-0">
				<button
					class="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-900 bg-white border-[3px] border-gray-900 rounded-xl shadow-[3px_3px_0_0_#1f293780] hover:shadow-[1px_1px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
					on:click={() => (showFilters = !showFilters)}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
						/>
					</svg>
					Filters
				</button>
				<div class="relative group">
					<button
						class="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-900 bg-white border-[3px] border-gray-900 rounded-xl shadow-[3px_3px_0_0_#1f293780] hover:shadow-[1px_1px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						Export
					</button>
					<div
						class="absolute right-0 mt-2 w-36 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f293780] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
					>
						<button
							class="w-full px-4 py-2.5 text-sm font-bold text-left text-gray-900 hover:bg-[#ffc480]/30 rounded-t-lg"
							on:click={() => handleExport('json')}
						>
							Export JSON
						</button>
						<button
							class="w-full px-4 py-2.5 text-sm font-bold text-left text-gray-900 hover:bg-[#ffc480]/30 rounded-b-lg border-t-2 border-gray-200"
							on:click={() => handleExport('csv')}
						>
							Export CSV
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Summary Cards -->
		{#if !isSummaryLoading && summary.totalLogs > 0}
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
				<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4 shadow-[4px_4px_0_0_#1f293780]">
					<div class="text-3xl font-bold text-gray-900">{summary.totalLogs || 0}</div>
					<div class="text-sm font-medium text-gray-600">Total Activities</div>
				</div>
				<div class="bg-green-50 rounded-xl border-[3px] border-green-800 p-4 shadow-[4px_4px_0_0_#16653480]">
					<div class="text-3xl font-bold text-green-700">{summary.byStatus?.success || 0}</div>
					<div class="text-sm font-medium text-green-700">Successful</div>
				</div>
				<div class="bg-[#ff6b6b]/10 rounded-xl border-[3px] border-[#ff6b6b] p-4 shadow-[4px_4px_0_0_#ff6b6b80]">
					<div class="text-3xl font-bold text-[#ff6b6b]">{summary.byStatus?.failure || 0}</div>
					<div class="text-sm font-medium text-[#ff6b6b]">Failed</div>
				</div>
				<div class="bg-blue-50 rounded-xl border-[3px] border-blue-800 p-4 shadow-[4px_4px_0_0_#1e40af80]">
					<div class="text-3xl font-bold text-blue-700">{summary.byCategory?.image || 0}</div>
					<div class="text-sm font-medium text-blue-700">Images Created</div>
				</div>
			</div>
		{/if}

		<!-- Filters Panel -->
		{#if showFilters}
			<div class="bg-white rounded-xl border-[3px] border-gray-900 p-5 mb-6 shadow-[4px_4px_0_0_#1f293780] transition-all">
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<label for="category-filter" class="block text-sm font-bold text-gray-900 mb-2">Category</label>
						<select
							id="category-filter"
							bind:value={category}
							on:change={handleFilterChange}
							class="w-full px-3 py-2.5 border-[3px] border-gray-900 rounded-xl text-sm font-medium focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480]"
						>
							{#each categories as cat}
								<option value={cat.value}>{cat.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="status-filter" class="block text-sm font-bold text-gray-900 mb-2">Status</label>
						<select
							id="status-filter"
							bind:value={status}
							on:change={handleFilterChange}
							class="w-full px-3 py-2.5 border-[3px] border-gray-900 rounded-xl text-sm font-medium focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480]"
						>
							{#each statuses as stat}
								<option value={stat.value}>{stat.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="start-date-filter" class="block text-sm font-bold text-gray-900 mb-2">Start Date</label>
						<input
							id="start-date-filter"
							type="date"
							bind:value={startDate}
							on:change={handleFilterChange}
							class="w-full px-3 py-2.5 border-[3px] border-gray-900 rounded-xl text-sm font-medium focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480]"
						/>
					</div>
					<div>
						<label for="end-date-filter" class="block text-sm font-bold text-gray-900 mb-2">End Date</label>
						<input
							id="end-date-filter"
							type="date"
							bind:value={endDate}
							on:change={handleFilterChange}
							class="w-full px-3 py-2.5 border-[3px] border-gray-900 rounded-xl text-sm font-medium focus:outline-none focus:shadow-[3px_3px_0_0_#ffc480]"
						/>
					</div>
				</div>
				<div class="mt-4 flex justify-end">
					<button class="text-sm font-bold text-[#ff6b6b] hover:underline" on:click={handleClearFilters}>
						Clear all filters
					</button>
				</div>
			</div>
		{/if}

		<!-- Logs Table -->
		<div class="bg-white rounded-xl border-[3px] border-gray-900 overflow-hidden shadow-[4px_4px_0_0_#1f293780]">
			{#if isLoading}
				<div class="p-8 flex justify-center">
					<Loader size="8" show={true} />
				</div>
			{:else if error}
				<div class="p-8 text-center text-[#ff6b6b]">
					<p class="font-bold">{error}</p>
					<button
						class="mt-4 text-sm font-bold text-gray-900 hover:underline"
						on:click={() => fetchLogs()}
					>
						Try again
					</button>
				</div>
			{:else if logs.length === 0}
				<div class="p-8 text-center text-gray-600">
					<div class="w-20 h-20 mx-auto mb-4 bg-[#ffc480]/30 rounded-2xl border-[3px] border-gray-900 flex items-center justify-center shadow-[4px_4px_0_0_#1f293780]">
						<svg class="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
					</div>
					<p class="text-xl font-bold text-gray-900">No activity logs found</p>
					<p class="text-sm mt-2 text-gray-600">Your activity logs will appear here once you start using the API</p>
				</div>
			{:else}
				<!-- Desktop Table -->
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full">
						<thead class="bg-[#ffc480]/20 border-b-[3px] border-gray-900">
							<tr>
								<th class="px-4 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Activity</th>
								<th class="px-4 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Category</th>
								<th class="px-4 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
								<th class="px-4 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Resource</th>
								<th class="px-4 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Duration</th>
								<th class="px-4 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Time</th>
								<th class="px-4 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wider"></th>
							</tr>
						</thead>
						<tbody class="divide-y-2 divide-gray-200">
							{#each logs as log}
								<tr class="hover:bg-[#ffc480]/10 transition-colors">
									<td class="px-4 py-4">
										<div class="flex items-center gap-3">
											<div
												class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center {categoryConfig[log.category]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={categoryConfig[log.category]?.iconPath || categoryConfig['other'].iconPath}/>
												</svg>
											</div>
											<div>
												<div class="font-bold text-gray-900 text-sm">{log.action}</div>
												<div class="text-xs text-gray-500 truncate max-w-xs">{log.description}</div>
											</div>
										</div>
									</td>
									<td class="px-4 py-4">
										<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold {categoryConfig[log.category]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}">
											{log.category}
										</span>
									</td>
									<td class="px-4 py-4">
										<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold {statusConfig[log.status]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}">
											<span class="w-2 h-2 rounded-full {statusConfig[log.status]?.dot || 'bg-gray-500'}"></span>
											{log.status}
										</span>
									</td>
									<td class="px-4 py-4 text-sm text-gray-600">
										{#if log.resourceName}
											<span class="truncate max-w-[150px] block font-medium">{log.resourceName}</span>
										{:else if log.resourceId}
											<span class="font-mono text-xs">{log.resourceId.substring(0, 12)}...</span>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</td>
									<td class="px-4 py-4 text-sm text-gray-600 font-mono font-bold">
										{formatDuration(log.duration)}
									</td>
									<td class="px-4 py-4 text-sm text-gray-500">
										{formatDate(log.createdAt)}
									</td>
									<td class="px-4 py-4 text-right">
										<button
											class="text-gray-500 hover:text-[#ff6b6b] p-1"
											on:click={() => openLogDetail(log)}
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
											</svg>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile List -->
				<div class="md:hidden divide-y-2 divide-gray-200">
					{#each logs as log}
						<button
							class="w-full px-4 py-4 text-left hover:bg-[#ffc480]/10 transition-colors"
							on:click={() => openLogDetail(log)}
						>
							<div class="flex items-start justify-between gap-3">
								<div class="flex items-start gap-3">
									<div
										class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center {categoryConfig[log.category]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={categoryConfig[log.category]?.iconPath || categoryConfig['other'].iconPath}/>
										</svg>
									</div>
									<div>
										<div class="font-bold text-gray-900 text-sm">{log.action}</div>
										<div class="text-xs text-gray-500 mt-1 line-clamp-2">{log.description}</div>
										<div class="flex items-center gap-2 mt-2">
											<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold {statusConfig[log.status]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}">
												<span class="w-1.5 h-1.5 rounded-full {statusConfig[log.status]?.dot || 'bg-gray-500'}"></span>
												{log.status}
											</span>
											<span class="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
										</div>
									</div>
								</div>
								<svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
								</svg>
							</div>
						</button>
					{/each}
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="border-t-[3px] border-gray-900 px-4 py-4 flex items-center justify-between bg-[#ffc480]/10">
						<div class="text-sm font-medium text-gray-700">
							Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} results
						</div>
						<div class="flex items-center gap-2">
							<button
								class="px-4 py-2 text-sm font-bold border-[3px] border-gray-900 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ffc480]/30 transition-colors"
								disabled={currentPage === 1}
								on:click={() => handlePageChange(currentPage - 1)}
							>
								Previous
							</button>
							<span class="text-sm font-bold text-gray-700">
								Page {currentPage} of {totalPages}
							</span>
							<button
								class="px-4 py-2 text-sm font-bold border-[3px] border-gray-900 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ffc480]/30 transition-colors"
								disabled={currentPage === totalPages}
								on:click={() => handlePageChange(currentPage + 1)}
							>
								Next
							</button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</section>

<!-- Log Detail Modal -->
{#if showLogDetail && selectedLog}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
		on:click={closeLogDetail}
		on:keydown={(e) => e.key === 'Escape' && closeLogDetail()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
		<div
			class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f293780] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="document"
		>
			<div class="sticky top-0 bg-[#ffc480] border-b-[3px] border-gray-900 px-6 py-4 flex items-center justify-between">
				<h2 id="modal-title" class="text-lg font-bold text-gray-900">Activity Details</h2>
				<button class="text-gray-900 hover:text-[#ff6b6b] p-1" on:click={closeLogDetail}>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
			<div class="p-6 space-y-6">
				<!-- Header Info -->
				<div class="flex items-center gap-4">
					<div
						class="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center {categoryConfig[selectedLog.category]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}"
					>
						<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={categoryConfig[selectedLog.category]?.iconPath || categoryConfig['other'].iconPath}/>
						</svg>
					</div>
					<div>
						<div class="text-xl font-bold text-gray-900">{selectedLog.action}</div>
						<div class="flex items-center gap-2 mt-1">
							<span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold {categoryConfig[selectedLog.category]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}">
								{selectedLog.category}
							</span>
							<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold {statusConfig[selectedLog.status]?.color || 'bg-gray-100 text-gray-800 border-2 border-gray-800'}">
								<span class="w-2 h-2 rounded-full {statusConfig[selectedLog.status]?.dot || 'bg-gray-500'}"></span>
								{selectedLog.status}
							</span>
						</div>
					</div>
				</div>

				<!-- Description -->
				<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
					<h3 class="text-sm font-bold text-gray-900 mb-2">Description</h3>
					<p class="text-gray-700">{selectedLog.description}</p>
				</div>

				<!-- Metadata Grid -->
				<div class="grid grid-cols-2 gap-4">
					{#if selectedLog.resourceType}
						<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
							<h3 class="text-sm font-bold text-gray-900 mb-1">Resource Type</h3>
							<p class="text-gray-700">{selectedLog.resourceType}</p>
						</div>
					{/if}
					{#if selectedLog.resourceId}
						<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
							<h3 class="text-sm font-bold text-gray-900 mb-1">Resource ID</h3>
							<p class="text-gray-700 font-mono text-sm break-all">{selectedLog.resourceId}</p>
						</div>
					{/if}
					{#if selectedLog.resourceName}
						<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
							<h3 class="text-sm font-bold text-gray-900 mb-1">Resource Name</h3>
							<p class="text-gray-700">{selectedLog.resourceName}</p>
						</div>
					{/if}
					{#if selectedLog.duration}
						<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
							<h3 class="text-sm font-bold text-gray-900 mb-1">Duration</h3>
							<p class="text-gray-700 font-mono font-bold">{formatDuration(selectedLog.duration)}</p>
						</div>
					{/if}
					<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
						<h3 class="text-sm font-bold text-gray-900 mb-1">Timestamp</h3>
						<p class="text-gray-700">{formatDate(selectedLog.createdAt)}</p>
					</div>
				</div>

				<!-- Request Info -->
				{#if selectedLog.request}
					<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
						<h3 class="text-sm font-bold text-gray-900 mb-3">Request Details</h3>
						<div class="space-y-2 text-sm">
							{#if selectedLog.request.method && selectedLog.request.endpoint}
								<div class="flex items-center gap-2">
									<span class="font-mono text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-lg border-2 border-blue-800 font-bold">{selectedLog.request.method}</span>
									<span class="text-gray-700 font-mono">{selectedLog.request.endpoint}</span>
								</div>
							{/if}
							{#if selectedLog.request.authMethod}
								<div class="text-gray-700">
									<span class="font-bold">Auth:</span> {selectedLog.request.authMethod}
								</div>
							{/if}
							{#if selectedLog.request.ip}
								<div class="text-gray-700">
									<span class="font-bold">IP:</span> {selectedLog.request.ip}
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Metadata -->
				{#if selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0}
					<div class="bg-white rounded-xl border-[3px] border-gray-900 p-4">
						<h3 class="text-sm font-bold text-gray-900 mb-3">Additional Details</h3>
						<div class="space-y-2 text-sm">
							{#if selectedLog.metadata.width && selectedLog.metadata.height}
								<div class="text-gray-700">
									<span class="font-bold">Dimensions:</span> {selectedLog.metadata.width} × {selectedLog.metadata.height}
								</div>
							{/if}
							{#if selectedLog.metadata.format}
								<div class="text-gray-700">
									<span class="font-bold">Format:</span> {selectedLog.metadata.format}
								</div>
							{/if}
							{#if selectedLog.metadata.templateName}
								<div class="text-gray-700">
									<span class="font-bold">Template:</span> {selectedLog.metadata.templateName}
								</div>
							{/if}
							{#if selectedLog.metadata.creditsUsed}
								<div class="text-gray-700">
									<span class="font-bold">Credits Used:</span> {selectedLog.metadata.creditsUsed}
								</div>
							{/if}
							{#if selectedLog.metadata.url}
								<div class="text-gray-700">
									<span class="font-bold">URL:</span>
									<a href={selectedLog.metadata.url} target="_blank" class="text-[#ff6b6b] hover:underline break-all font-bold">
										{selectedLog.metadata.url}
									</a>
								</div>
							{/if}
							{#if selectedLog.metadata.batchSize}
								<div class="text-gray-700">
									<span class="font-bold">Batch Size:</span> {selectedLog.metadata.batchSize}
								</div>
							{/if}
							{#if selectedLog.metadata.variablesUsed?.length}
								<div class="text-gray-700">
									<span class="font-bold">Variables:</span> {selectedLog.metadata.variablesUsed.join(', ')}
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Error Info -->
				{#if selectedLog.error}
					<div class="bg-[#ff6b6b]/10 rounded-xl border-[3px] border-[#ff6b6b] p-4">
						<h3 class="text-sm font-bold text-[#ff6b6b] mb-2">Error Details</h3>
						<p class="text-[#ff6b6b] font-medium">{selectedLog.error.message}</p>
							{#if selectedLog.error.code}
							<p class="text-[#ff6b6b]/80 text-sm mt-1">Code: {selectedLog.error.code}</p>
							{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<Toast />
