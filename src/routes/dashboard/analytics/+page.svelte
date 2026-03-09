<script>
	import { onMount } from 'svelte';
	import { getCdnAnalytics } from '../../../api/cdn';
	import { analytics } from '$lib/analytics.js';

	let isLoading = true;
	let data = null;
	let timeRange = '30d';
	let sortBy = 'hits';
	let currentPage = 1;
	let hoveredBar = -1;
	let expandedReferrers = false;
	let expandedCountries = false;

	$: filteredDailyStats = data?.dailyStats || [];
	$: rawMax = Math.max(...filteredDailyStats.map(d => d.hits), 0);
	$: chartMax = rawMax === 0 ? 4 : Math.ceil(rawMax / 4) * 4;
	$: bytesMax = Math.max(...filteredDailyStats.map(d => d.bytes), 0);
	$: bytesChartMax = bytesMax === 0 ? 4 : Math.ceil(bytesMax / 4) * 4;
	$: summary = data?.summary || { totalHits: 0, totalBytes: 0, totalAssets: 0, periodHits: 0, periodBytes: 0, periodUniqueIps: 0 };
	$: assets = data?.assets || [];
	$: pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
	$: statusCodes = data?.statusCodeBreakdown || { _200: 0, _304: 0, _other: 0 };
	$: totalStatusHits = statusCodes._200 + statusCodes._304 + statusCodes._other;
	$: topReferrers = data?.topReferrers || [];
	$: topCountries = data?.topCountries || [];

	// Chart mode toggle
	let chartMode = 'views'; // 'views' | 'bandwidth'

	async function loadData() {
		isLoading = true;
		try {
			data = await getCdnAnalytics({ range: timeRange, sort: sortBy, page: currentPage, limit: 20 });
		} catch (err) {
			console.error('Failed to load analytics:', err);
		} finally {
			isLoading = false;
		}
	}

	function changeRange(range) {
		timeRange = range;
		currentPage = 1;
		loadData();
	}

	function changeSort(sort) {
		sortBy = sort;
		currentPage = 1;
		loadData();
	}

	function goToPage(page) {
		if (page < 1 || page > pagination.totalPages) return;
		currentPage = page;
		loadData();
	}

	function formatBytes(bytes) {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function formatNumber(num) {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
	}

	function timeAgo(dateStr) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const seconds = Math.floor((now - date) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getPercentage(value, total) {
		if (!total) return 0;
		return Math.round((value / total) * 100);
	}

	function getAssetFilename(assetKey) {
		if (!assetKey) return 'Unknown';
		const parts = assetKey.split('/');
		return parts[parts.length - 1];
	}

	onMount(() => {
		analytics.page('Analytics');
		loadData();
	});
</script>

<svelte:head>
	<title>Analytics - Pictify.io</title>
</svelte:head>

<section class="min-h-full pb-12 relative z-0">
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"></div>

	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12 pt-4">
		<div>
			<div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c4b5fd] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-full transform -rotate-1 mb-6">
				<span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse border border-black"></span>
				<span class="text-xs font-black text-black uppercase tracking-widest">Analytics</span>
			</div>
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tighter leading-[0.9]">
				Image Analytics
			</h1>
			<p class="mt-3 text-sm font-bold text-gray-500 uppercase tracking-wider">Deep insights into your shared image performance</p>
		</div>

		<!-- Time Range Selector -->
		<div class="flex items-center gap-2">
			{#each ['7d', '30d', '90d'] as range}
				<button
					on:click={() => changeRange(range)}
					class="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl border-[3px] transition-all duration-200
						{timeRange === range
							? 'bg-black text-white border-black shadow-[4px_4px_0_0_#ffc480]'
							: 'bg-white text-black border-black hover:shadow-[3px_3px_0_0_black] hover:-translate-y-0.5'}"
				>
					{range === '7d' ? 'Week' : range === '30d' ? 'Month' : 'Quarter'}
				</button>
			{/each}
		</div>
	</div>

	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-20">
			<div class="w-12 h-12 border-[3px] border-gray-900 border-t-[#c4b5fd] rounded-full animate-spin"></div>
			<p class="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Loading analytics...</p>
		</div>
	{:else}

		<!-- Summary Metrics - 4 cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
			<!-- Period Views -->
			<div class="bg-[#ffc480] rounded-3xl border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 md:p-6 relative overflow-hidden group">
				<div class="absolute -right-8 -top-8 w-28 h-28 bg-white/20 rounded-full blur-2xl group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-700"></div>
				<div class="relative z-10">
					<div class="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">Views ({timeRange})</div>
					<div class="text-3xl md:text-4xl font-black text-black tracking-tighter leading-none">{formatNumber(summary.periodHits)}</div>
					<div class="text-[10px] font-bold text-black/50 mt-2 uppercase tracking-wider">{formatNumber(summary.totalHits)} all time</div>
				</div>
			</div>

			<!-- Bandwidth -->
			<div class="bg-[#c4b5fd] rounded-3xl border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 md:p-6 relative overflow-hidden group">
				<div class="absolute -left-6 -bottom-6 w-24 h-24 bg-black/5 transform rotate-12 group-hover:rotate-45 transition-transform duration-700"></div>
				<div class="relative z-10">
					<div class="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">Bandwidth ({timeRange})</div>
					<div class="text-3xl md:text-4xl font-black text-black tracking-tighter leading-none">{formatBytes(summary.periodBytes)}</div>
					<div class="text-[10px] font-bold text-black/50 mt-2 uppercase tracking-wider">{formatBytes(summary.totalBytes)} all time</div>
				</div>
			</div>

			<!-- Unique Visitors -->
			<div class="bg-[#4ade80] rounded-3xl border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 md:p-6 relative overflow-hidden group">
				<div class="absolute -right-6 -bottom-6 w-28 h-28 bg-white/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
				<div class="relative z-10">
					<div class="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">Unique IPs ({timeRange})</div>
					<div class="text-3xl md:text-4xl font-black text-black tracking-tighter leading-none">{formatNumber(summary.periodUniqueIps)}</div>
				</div>
			</div>

			<!-- Total Assets -->
			<div class="bg-[#ff6b6b] rounded-3xl border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 md:p-6 relative overflow-hidden group">
				<div class="absolute -left-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-xl group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-700"></div>
				<div class="relative z-10">
					<div class="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">Tracked Assets</div>
					<div class="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none">{summary.totalAssets}</div>
				</div>
			</div>
		</div>

		<!-- Chart Section -->
		<div class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden mb-10">
			<!-- Chart Header -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border-b-[3px] border-black bg-gray-50">
				<div class="flex items-center gap-3">
					<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-black shadow-[1px_1px_0_0_black]"></div>
					<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-black shadow-[1px_1px_0_0_black]"></div>
					<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-black shadow-[1px_1px_0_0_black]"></div>
					<div class="ml-2">
						<span class="text-sm font-black text-black uppercase tracking-widest">Traffic Over Time</span>
						<p class="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wide">
							{chartMode === 'views' ? 'Daily views across all shared images' : 'Daily bandwidth consumption'}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2 mt-4 sm:mt-0">
					<button
						on:click={() => chartMode = 'views'}
						class="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border-[2px] transition-all duration-200
							{chartMode === 'views'
								? 'bg-black text-white border-black shadow-[2px_2px_0_0_#c4b5fd]'
								: 'bg-white text-black border-black hover:shadow-[2px_2px_0_0_black]'}"
					>Views</button>
					<button
						on:click={() => chartMode = 'bandwidth'}
						class="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border-[2px] transition-all duration-200
							{chartMode === 'bandwidth'
								? 'bg-black text-white border-black shadow-[2px_2px_0_0_#c4b5fd]'
								: 'bg-white text-black border-black hover:shadow-[2px_2px_0_0_black]'}"
					>Bandwidth</button>
				</div>
			</div>

			<!-- Chart Body -->
			<div class="p-5 sm:p-8 flex flex-col min-h-[300px] sm:min-h-[400px] relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
				{#if filteredDailyStats.length > 0}
					{#if true}
						{@const currentMax = chartMode === 'views' ? chartMax : bytesChartMax}
						<div class="relative flex-1 flex flex-col">
							<!-- Y-Axis Grid Lines -->
							<div class="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
								{#each [1, 0.75, 0.5, 0.25, 0] as tick}
									<div class="w-full border-t-[2px] {tick === 0 ? 'border-black' : 'border-dashed border-gray-300'} flex-1 relative" style="{tick === 0 ? 'flex-grow: 0; border-top-style: solid;' : ''}">
										{#if tick !== 0}
											<div class="absolute -top-[10px] right-0 translate-x-4 sm:translate-x-6 bg-white px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0_0_black] rounded-md">
												{chartMode === 'views' ? formatNumber(currentMax * tick) : formatBytes(currentMax * tick)}
											</div>
										{/if}
									</div>
								{/each}
							</div>

							<!-- Bars -->
							<div class="absolute inset-0 flex items-end gap-[2px] sm:gap-1 z-10 pr-12 sm:pr-16">
								{#each filteredDailyStats as stat, i}
									<!-- svelte-ignore a11y-no-static-element-interactions -->
									<div class="flex-1 h-full flex flex-col justify-end group cursor-pointer relative"
										 on:mouseenter={() => hoveredBar = i}
										 on:mouseleave={() => hoveredBar = -1}
									>
										<!-- Tooltip -->
										<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 translate-y-2 group-hover:translate-y-0 hidden sm:block">
											<div class="bg-black text-white px-3 py-2.5 rounded-xl border-[2px] border-black font-black shadow-[4px_4px_0_0_#c4b5fd] whitespace-nowrap flex flex-col items-center gap-1">
												<span class="text-[10px] text-gray-400 uppercase tracking-widest leading-none">{formatDate(stat.date)}</span>
												<span class="text-sm leading-none">{formatNumber(stat.hits)} <span class="text-gray-400 font-bold">views</span></span>
												<span class="text-[10px] text-gray-400 leading-none">{formatBytes(stat.bytes)}</span>
											</div>
										</div>

										<div class="w-full border-[2px] border-b-0 border-black rounded-t-sm transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden
											{chartMode === 'views' ? 'bg-[#c4b5fd] group-hover:bg-[#a78bfa]' : 'bg-[#ffc480] group-hover:bg-[#f59e0b]'}"
											 style="height: {Math.max(((chartMode === 'views' ? stat.hits : stat.bytes) / currentMax) * 100, 1)}%"
										>
											<div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.15)_25%,rgba(0,0,0,0.15)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.15)_75%,rgba(0,0,0,0.15)_100%)] [background-size:6px_6px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
											<div class="w-full h-1 bg-white/40 border-b border-black/20"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- X-Axis Labels -->
						<div class="flex justify-between items-center mt-3 z-10 px-1 pr-12 sm:pr-16">
							<div class="bg-white rounded-md border-[2px] border-black shadow-[2px_2px_0_0_black] px-2 py-1 text-[10px] font-black text-black uppercase tracking-widest">{formatDate(filteredDailyStats[0].date)}</div>
							{#if filteredDailyStats.length > 2}
								<div class="bg-white rounded-md border-[2px] border-black shadow-[2px_2px_0_0_black] px-2 py-1 text-[10px] font-black text-black uppercase tracking-widest">{formatDate(filteredDailyStats[Math.floor(filteredDailyStats.length / 2)].date)}</div>
							{/if}
							<div class="bg-white rounded-md border-[2px] border-black shadow-[2px_2px_0_0_black] px-2 py-1 text-[10px] font-black text-black uppercase tracking-widest">{formatDate(filteredDailyStats[filteredDailyStats.length-1].date)}</div>
						</div>
					{/if}
				{:else}
					<div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-white/50 backdrop-blur-sm">
						<div class="w-16 h-16 bg-white rounded-2xl border-[3px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0_0_black] rotate-3">
							<svg class="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
							</svg>
						</div>
						<p class="text-sm font-black text-black uppercase tracking-wider">No traffic in this period</p>
						<p class="text-xs font-bold text-gray-500 mt-1">Share your images to start seeing analytics</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Middle Row: Referrers + Countries + Status Codes -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
			<!-- Top Referrers -->
			<div class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden">
				<div class="flex items-center justify-between p-5 border-b-[3px] border-black bg-gray-50">
					<div class="flex items-center gap-3">
						<div class="w-7 h-7 rounded-lg bg-[#ffc480] border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black]">
							<svg class="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/>
							</svg>
						</div>
						<span class="text-xs font-black text-black uppercase tracking-widest">Top Referrers</span>
					</div>
					{#if topReferrers.length > 10}
						<button on:click={() => expandedReferrers = !expandedReferrers} class="text-[10px] font-black text-[#ff6b6b] uppercase tracking-wider">
							{expandedReferrers ? 'Show less' : 'Show all'}
						</button>
					{/if}
				</div>
				<div class="p-5 space-y-2.5 max-h-[400px] overflow-y-auto">
					{#if topReferrers.length > 0}
						{#each (expandedReferrers ? topReferrers : topReferrers.slice(0, 10)) as ref, i}
							<div class="flex items-center gap-3 text-xs group">
								<span class="w-5 text-right font-black text-gray-400 text-[10px]">{i + 1}</span>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between mb-1">
										<span class="font-bold text-gray-700 truncate max-w-[180px] group-hover:text-black transition-colors">{ref.referrer || 'Direct'}</span>
										<span class="font-black text-black bg-gray-100 px-2 py-0.5 rounded border-[2px] border-black shadow-[1px_1px_0_0_black] text-[10px] ml-2 flex-shrink-0">{formatNumber(ref.hits)}</span>
									</div>
									<div class="w-full bg-gray-200 rounded-full h-1.5 border border-gray-300">
										<div class="bg-[#ffc480] h-full rounded-full border-r border-black/20 transition-all duration-500" style="width: {getPercentage(ref.hits, topReferrers[0]?.hits)}%"></div>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-center py-8">
							<p class="text-sm font-bold text-gray-500">No referrer data yet</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Top Countries -->
			<div class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden">
				<div class="flex items-center justify-between p-5 border-b-[3px] border-black bg-gray-50">
					<div class="flex items-center gap-3">
						<div class="w-7 h-7 rounded-lg bg-[#4ade80] border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black]">
							<svg class="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
						<span class="text-xs font-black text-black uppercase tracking-widest">Top Countries</span>
					</div>
					{#if topCountries.length > 10}
						<button on:click={() => expandedCountries = !expandedCountries} class="text-[10px] font-black text-[#ff6b6b] uppercase tracking-wider">
							{expandedCountries ? 'Show less' : 'Show all'}
						</button>
					{/if}
				</div>
				<div class="p-5 space-y-2.5 max-h-[400px] overflow-y-auto">
					{#if topCountries.length > 0}
						{#each (expandedCountries ? topCountries : topCountries.slice(0, 10)) as country, i}
							<div class="flex items-center gap-3 text-xs group">
								<span class="w-5 text-right font-black text-gray-400 text-[10px]">{i + 1}</span>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between mb-1">
										<span class="font-bold text-gray-700 truncate max-w-[180px] group-hover:text-black transition-colors">{country.country}</span>
										<span class="font-black text-black bg-gray-100 px-2 py-0.5 rounded border-[2px] border-black shadow-[1px_1px_0_0_black] text-[10px] ml-2 flex-shrink-0">{formatNumber(country.hits)}</span>
									</div>
									<div class="w-full bg-gray-200 rounded-full h-1.5 border border-gray-300">
										<div class="bg-[#4ade80] h-full rounded-full border-r border-black/20 transition-all duration-500" style="width: {getPercentage(country.hits, topCountries[0]?.hits)}%"></div>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-center py-8">
							<p class="text-sm font-bold text-gray-500">No country data yet</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Status Code Breakdown -->
			<div class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden">
				<div class="flex items-center gap-3 p-5 border-b-[3px] border-black bg-gray-50">
					<div class="w-7 h-7 rounded-lg bg-[#c4b5fd] border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black]">
						<svg class="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<span class="text-xs font-black text-black uppercase tracking-widest">Response Status</span>
				</div>
				<div class="p-5">
					{#if totalStatusHits > 0}
						<!-- Visual Bar -->
						<div class="flex rounded-xl overflow-hidden h-8 border-[3px] border-black shadow-[3px_3px_0_0_black] mb-6">
							{#if statusCodes._200 > 0}
								<div class="bg-[#4ade80] flex items-center justify-center transition-all duration-500" style="width: {getPercentage(statusCodes._200, totalStatusHits)}%">
									{#if getPercentage(statusCodes._200, totalStatusHits) > 15}
										<span class="text-[10px] font-black text-black">200</span>
									{/if}
								</div>
							{/if}
							{#if statusCodes._304 > 0}
								<div class="bg-[#ffc480] flex items-center justify-center transition-all duration-500" style="width: {getPercentage(statusCodes._304, totalStatusHits)}%">
									{#if getPercentage(statusCodes._304, totalStatusHits) > 15}
										<span class="text-[10px] font-black text-black">304</span>
									{/if}
								</div>
							{/if}
							{#if statusCodes._other > 0}
								<div class="bg-[#ff6b6b] flex items-center justify-center transition-all duration-500" style="width: {getPercentage(statusCodes._other, totalStatusHits)}%">
									{#if getPercentage(statusCodes._other, totalStatusHits) > 15}
										<span class="text-[10px] font-black text-white">Other</span>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Legend -->
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="w-4 h-4 bg-[#4ade80] rounded border-[2px] border-black"></div>
									<span class="text-xs font-black text-black uppercase tracking-wider">200 OK</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xs font-bold text-gray-500">{getPercentage(statusCodes._200, totalStatusHits)}%</span>
									<span class="text-xs font-black text-black bg-gray-100 px-2 py-0.5 rounded border-[2px] border-black shadow-[1px_1px_0_0_black]">{formatNumber(statusCodes._200)}</span>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="w-4 h-4 bg-[#ffc480] rounded border-[2px] border-black"></div>
									<span class="text-xs font-black text-black uppercase tracking-wider">304 Cached</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xs font-bold text-gray-500">{getPercentage(statusCodes._304, totalStatusHits)}%</span>
									<span class="text-xs font-black text-black bg-gray-100 px-2 py-0.5 rounded border-[2px] border-black shadow-[1px_1px_0_0_black]">{formatNumber(statusCodes._304)}</span>
								</div>
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<div class="w-4 h-4 bg-[#ff6b6b] rounded border-[2px] border-black"></div>
									<span class="text-xs font-black text-black uppercase tracking-wider">Other</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xs font-bold text-gray-500">{getPercentage(statusCodes._other, totalStatusHits)}%</span>
									<span class="text-xs font-black text-black bg-gray-100 px-2 py-0.5 rounded border-[2px] border-black shadow-[1px_1px_0_0_black]">{formatNumber(statusCodes._other)}</span>
								</div>
							</div>
						</div>

						<!-- Cache Hit Rate Highlight -->
						{#if true}
							{@const cacheRate = getPercentage(statusCodes._200 + statusCodes._304, totalStatusHits)}
							<div class="mt-6 p-4 bg-[#4ade80]/10 rounded-xl border-[2px] border-[#4ade80]">
								<div class="text-[10px] font-black text-black/60 uppercase tracking-widest mb-1">Success Rate</div>
								<div class="text-2xl font-black text-black">{cacheRate}%</div>
							</div>
						{/if}
					{:else}
						<div class="text-center py-8">
							<p class="text-sm font-bold text-gray-500">No status data yet</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Asset-Level Breakdown Table -->
		<div class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden">
			<!-- Table Header -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border-b-[3px] border-black bg-gray-50">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-xl bg-[#ffc480] border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black]">
						<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
					</div>
					<div>
						<span class="text-xs font-black text-black uppercase tracking-widest">Per-Image Breakdown</span>
						<p class="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wide">{pagination.total} tracked images</p>
					</div>
				</div>
				<!-- Sort Controls -->
				<div class="flex items-center gap-2 mt-4 sm:mt-0">
					<span class="text-[10px] font-black text-gray-500 uppercase tracking-wider mr-1">Sort:</span>
					{#each [{key: 'hits', label: 'Views'}, {key: 'bytes', label: 'Size'}, {key: 'recent', label: 'Recent'}] as opt}
						<button
							on:click={() => changeSort(opt.key)}
							class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border-[2px] transition-all duration-200
								{sortBy === opt.key
									? 'bg-black text-white border-black shadow-[2px_2px_0_0_#ffc480]'
									: 'bg-white text-black border-black hover:shadow-[2px_2px_0_0_black]'}"
						>{opt.label}</button>
					{/each}
				</div>
			</div>

			<!-- Table Content -->
			<div class="divide-y-[2px] divide-gray-200">
				{#if assets.length > 0}
					{#each assets as asset, i}
						<div class="flex items-center gap-4 p-4 md:p-5 hover:bg-[#ffc480]/10 transition-colors group">
							<!-- Rank -->
							<div class="w-6 font-black text-gray-400 text-sm text-center flex-shrink-0">
								{(currentPage - 1) * 20 + i + 1}
							</div>

							<!-- Thumbnail / Template Info -->
							<div class="flex items-center gap-3 flex-1 min-w-0">
								{#if asset.templateThumbnail}
									<div class="w-10 h-10 rounded-lg border-[2px] border-black overflow-hidden flex-shrink-0 shadow-[2px_2px_0_0_black] group-hover:shadow-[3px_3px_0_0_black] transition-all">
										<img src={asset.templateThumbnail} alt="" class="w-full h-full object-cover" />
									</div>
								{:else}
									<div class="w-10 h-10 rounded-lg border-[2px] border-black flex items-center justify-center bg-gray-50 flex-shrink-0 shadow-[2px_2px_0_0_black]">
										<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
										</svg>
									</div>
								{/if}
								<div class="min-w-0">
									{#if asset.templateName}
										<a href="/dashboard/template/{asset.templateUid}" class="text-sm font-black text-black truncate block hover:text-[#ff6b6b] transition-colors">{asset.templateName}</a>
									{/if}
									<p class="text-[10px] font-bold text-gray-400 truncate max-w-[200px] sm:max-w-[300px]">{getAssetFilename(asset.assetKey)}</p>
								</div>
							</div>

							<!-- Period Views -->
							<div class="text-right flex-shrink-0 hidden sm:block">
								<div class="text-sm font-black text-black">{formatNumber(asset.periodHits)}</div>
								<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">views</div>
							</div>

							<!-- Period Bandwidth -->
							<div class="text-right flex-shrink-0 hidden md:block">
								<div class="text-sm font-black text-black">{formatBytes(asset.periodBytes)}</div>
								<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">bandwidth</div>
							</div>

							<!-- All-time Views -->
							<div class="text-right flex-shrink-0 hidden lg:block">
								<div class="text-sm font-black text-gray-600">{formatNumber(asset.totalHits)}</div>
								<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">all time</div>
							</div>

							<!-- Last Seen -->
							<div class="text-right flex-shrink-0 hidden lg:block w-20">
								<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{timeAgo(asset.lastSeen)}</div>
							</div>

							<!-- Mobile summary -->
							<div class="text-right flex-shrink-0 sm:hidden">
								<div class="text-sm font-black text-black">{formatNumber(asset.periodHits)}</div>
								<div class="text-[10px] font-bold text-gray-400">{formatBytes(asset.periodBytes)}</div>
							</div>
						</div>
					{/each}
				{:else}
					<div class="p-12 text-center">
						<div class="w-16 h-16 bg-gray-100 rounded-2xl border-[3px] border-gray-300 flex items-center justify-center mb-4 mx-auto transform -rotate-3">
							<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
						</div>
						<p class="text-lg font-black text-black mb-2">No tracked images yet</p>
						<p class="text-sm font-bold text-gray-500 max-w-sm mx-auto">Share your generated images to start tracking their performance.</p>
					</div>
				{/if}
			</div>

			<!-- Pagination -->
			{#if pagination.totalPages > 1}
				<div class="flex items-center justify-between p-5 border-t-[3px] border-black bg-gray-50">
					<div class="text-[10px] font-black text-gray-500 uppercase tracking-widest">
						Page {pagination.page} of {pagination.totalPages}
					</div>
					<div class="flex items-center gap-2">
						<button
							on:click={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-[2px] border-black transition-all duration-200
								{currentPage === 1
									? 'bg-gray-100 text-gray-400 cursor-not-allowed'
									: 'bg-white text-black hover:shadow-[2px_2px_0_0_black] hover:-translate-y-0.5'}"
						>
							Prev
						</button>
						{#each Array.from({length: Math.min(pagination.totalPages, 5)}, (_, i) => {
							if (pagination.totalPages <= 5) return i + 1;
							if (currentPage <= 3) return i + 1;
							if (currentPage >= pagination.totalPages - 2) return pagination.totalPages - 4 + i;
							return currentPage - 2 + i;
						}) as pageNum}
							<button
								on:click={() => goToPage(pageNum)}
								class="w-8 h-8 text-[10px] font-black uppercase rounded-lg border-[2px] border-black transition-all duration-200
									{pageNum === currentPage
										? 'bg-black text-white shadow-[2px_2px_0_0_#ffc480]'
										: 'bg-white text-black hover:shadow-[2px_2px_0_0_black]'}"
							>{pageNum}</button>
						{/each}
						<button
							on:click={() => goToPage(currentPage + 1)}
							disabled={currentPage === pagination.totalPages}
							class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-[2px] border-black transition-all duration-200
								{currentPage === pagination.totalPages
									? 'bg-gray-100 text-gray-400 cursor-not-allowed'
									: 'bg-white text-black hover:shadow-[2px_2px_0_0_black] hover:-translate-y-0.5'}"
						>
							Next
						</button>
					</div>
				</div>
			{/if}
		</div>

	{/if}
</section>
