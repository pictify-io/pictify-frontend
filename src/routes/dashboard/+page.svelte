<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '../../store/user.store';
	import { plgStatus, PLAN_DISPLAY_NAMES } from '../../store/plg.store';
	import { cdnStore, initCdnAnalytics } from '../../store/cdn.store';
	import { teamStore, currentTeam } from '../../store/team.store';
	import { onboardingStore, showOnboarding, initOnboarding, completeStepAction, dismissOnboardingAction, toggleOnboardingCollapse } from '../../store/onboarding.store';
	import { fetchAuditLogs } from '../../api/audit';
	import { getTemplates } from '../../api/template';
	import { analytics } from '$lib/analytics.js';

	let isLoading = true;
	let recentLogs = [];
	let recentTemplates = [];
	let totalTemplates = 0;
	let cdnTimeRange = '30d';

	// Filtered daily stats based on time range
	$: filteredDailyStats = getFilteredStats($cdnStore.dailyStats, cdnTimeRange);
	$: rawMax = Math.max(...filteredDailyStats.map(d => d.hits), 0);
	$: chartMax = rawMax === 0 ? 4 : Math.ceil(rawMax / 4) * 4;
	$: planName = PLAN_DISPLAY_NAMES[$plgStatus.plan] || 'Starter';
	$: teamName = $currentTeam?.name || 'My Workspace';
	$: memberCount = $teamStore?.members?.length || 1;

	function getFilteredStats(dailyStats, range) {
		if (!dailyStats || !dailyStats.length) return [];
		const now = new Date();
		let daysBack = 30;
		if (range === '7d') daysBack = 7;
		else if (range === '90d') daysBack = 90;

		const cutoff = new Date(now);
		cutoff.setDate(cutoff.getDate() - daysBack);
		const cutoffStr = cutoff.toISOString().split('T')[0];

		return dailyStats.filter(d => d.date >= cutoffStr);
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

	function timeAgo(dateStr) {
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

	function getCategoryIcon(category) {
		const icons = {
			image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			gif: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
			pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
			template: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z',
			auth: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
			api: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
			batch: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
			webhook: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101',
			connector: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101',
		};
		return icons[category] || icons.image;
	}

	function getCategoryColor(category) {
		const colors = {
			image: 'bg-blue-100 text-blue-700 border-blue-700',
			gif: 'bg-green-100 text-green-700 border-green-700',
			pdf: 'bg-red-100 text-red-700 border-red-700',
			template: 'bg-purple-100 text-purple-700 border-purple-700',
			auth: 'bg-yellow-100 text-yellow-700 border-yellow-700',
			api: 'bg-indigo-100 text-indigo-700 border-indigo-700',
			batch: 'bg-orange-100 text-orange-700 border-orange-700',
		};
		return colors[category] || 'bg-gray-100 text-gray-700 border-gray-700';
	}

	function getStatusDot(status) {
		if (status === 'success') return 'bg-[#4ade80]';
		if (status === 'failure') return 'bg-[#ff6b6b]';
		return 'bg-[#ffc480]';
	}

	onMount(async () => {
		analytics.page('Dashboard Home');

		try {
			// Fetch data in parallel
			const [cdnData, logsData, templatesData] = await Promise.all([
				initCdnAnalytics(),
				fetchAuditLogs({ limit: 8 }).catch(() => ({ logs: [] })),
				getTemplates({ page: 1, limit: 6, sort: 'newest' }).catch(() => null),
			]);

			recentLogs = logsData?.logs || [];
			recentTemplates = templatesData?.templates || [];
			totalTemplates = templatesData?.pagination?.total || recentTemplates.length;
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>Dashboard - Pictify.io</title>
</svelte:head>

<section class="min-h-full pb-12 relative z-0">
	<!-- Background Pattern -->
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"></div>

	<!-- Welcome Header & Primary Action -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12 pt-4">
		<div>
			<div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ffc480] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-full transform -rotate-1 mb-6">
				<span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse border border-black"></span>
				<span class="text-xs font-black text-black uppercase tracking-widest">Command Center</span>
			</div>
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tighter leading-[0.9]">
				Welcome back.
			</h1>
		</div>

		<div class="flex items-center gap-4">
			<a
				href="/dashboard/template/create"
				class="group flex items-center gap-3 bg-[#ff6b6b] border-[3px] border-black shadow-[6px_6px_0_0_black] rounded-2xl px-6 py-3 md:px-8 md:py-4 hover:shadow-[2px_2px_0_0_black] hover:translate-x-[4px] hover:translate-y-[4px] transform hover:rotate-1 transition-all duration-200"
			>
				<span class="text-white font-black text-lg uppercase tracking-wide">Create Template</span>
				<div class="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl border-[3px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[2px_2px_0_0_black]">
					<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
					</svg>
				</div>
			</a>
		</div>
	</div>

	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-20">
			<div class="w-12 h-12 border-[3px] border-gray-900 border-t-[#ffc480] rounded-full animate-spin"></div>
			<p class="mt-4 text-sm font-bold text-gray-500 uppercase tracking-widest">Loading dashboard...</p>
		</div>
	{:else}
		

		<!-- 1. Pulse Metrics (Top Full-Width) -->
		<!-- Performance Command Center -->
		<div class="mb-12">
			<div class="flex items-center gap-3 mb-6">
				<h2 class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3">
					<span class="w-3 h-3 bg-[#ff6b6b] rounded-full border-[2px] border-black"></span>
					Performance Analytics
				</h2>
			</div>

			<!-- Analytics Layout: Top row aggregated metrics, bottom row split chart & top templates -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Aggregated Metric: Views -->
				<div class="bg-[#ffc480] rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] p-6 flex flex-col justify-center relative overflow-hidden group">
					<!-- Geometric background shape -->
					<div class="absolute -right-12 -top-12 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-700"></div>
					<div class="relative z-10">
						<div class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2">Total Views</div>
						<div class="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter leading-none">{formatNumber($cdnStore.totalHits)}</div>
					</div>
				</div>

				<!-- Aggregated Metric: Templates -->
				<div class="bg-indigo-300 rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] p-6 flex flex-col justify-center relative overflow-hidden group">
					<!-- Geometric background shape -->
					<div class="absolute -right-6 -bottom-6 w-32 h-32 bg-black/5 transform rotate-12 group-hover:rotate-45 transition-transform duration-700"></div>
					<div class="relative z-10">
						<div class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2">Total Templates</div>
						<div class="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter leading-none">{totalTemplates}</div>
					</div>
				</div>

				<!-- Aggregated Metric: Assets -->
				<div class="bg-[#4ade80] rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] p-6 flex flex-col justify-center relative overflow-hidden group">
					<!-- Geometric background shape -->
					<div class="absolute -left-10 -bottom-10 w-36 h-36 bg-white/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
					<div class="relative z-10">
						<div class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2">Shared Links</div>
						<div class="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter leading-none">{$cdnStore.totalAssets}</div>
					</div>
				</div>
			</div>
		</div>

		
		<!-- Main Split -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-12 items-start">

			<!-- ROW 1: Chart + Quick Actions -->
			<div class="lg:col-span-8 flex flex-col h-full">
				<!-- Image Delivery Chart -->
				<div class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden flex flex-col h-full">
					<!-- Chart Header -->
					<div class="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border-b-[3px] border-black bg-gray-50 flex-shrink-0">
						<div class="flex items-center gap-3">
							<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-black shadow-[1px_1px_0_0_black]"></div>
							<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-black shadow-[1px_1px_0_0_black]"></div>
							<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-black shadow-[1px_1px_0_0_black]"></div>
							<div class="ml-2">
								<span class="text-sm font-black text-black uppercase tracking-widest">Image Delivery</span>
								<p class="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wide">Daily views on your shared images</p>
							</div>
						</div>
						<div class="flex items-center gap-2 mt-4 sm:mt-0">
							{#each ['7d', '30d', '90d'] as range}
								<button
									on:click={() => cdnTimeRange = range}
									class="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border-[2px] transition-all duration-200
										{cdnTimeRange === range
											? 'bg-black text-white border-black shadow-[2px_2px_0_0_#ffc480]'
											: 'bg-white text-black border-black hover:shadow-[2px_2px_0_0_black] hover:-translate-y-0.5'}"
								>
									{range}
								</button>
							{/each}
						</div>
					</div>

					<!-- Chart Body -->
					<div class="p-5 sm:p-8 flex-1 flex flex-col min-h-[300px] sm:min-h-[400px] relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
						{#if filteredDailyStats.length > 0}
							<!-- Chart Area (Grid + Bars) -->
							<div class="relative flex-1 flex flex-col">
								<!-- Y-Axis Grid Lines & Labels -->
								<div class="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
									{#each [1, 0.75, 0.5, 0.25, 0] as tick}
										<div class="w-full border-t-[2px] {tick === 0 ? 'border-black' : 'border-dashed border-gray-300'} flex-1 relative flex items-start justify-end" style="{tick === 0 ? 'flex-grow: 0; border-top-style: solid;' : ''}">
											<!-- Tick Label -->
											{#if tick !== 0}
												<div class="absolute -top-[10px] right-0 translate-x-4 sm:translate-x-6 bg-white px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0_0_black] rounded-md pointer-events-auto">
													{formatNumber(chartMax * tick)}
												</div>
											{/if}
										</div>
									{/each}
								</div>

								<!-- Bars Area -->
								<div class="absolute inset-0 flex items-end gap-[2px] sm:gap-1 z-10 pr-12 sm:pr-16">
									{#each filteredDailyStats as stat}
										 <!-- The Bar wrapper -->
										 <div class="flex-1 h-full flex flex-col justify-end group cursor-pointer relative">
											<!-- Brutalist Tooltip -->
											<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 translate-y-2 group-hover:translate-y-0 hidden sm:block">
												<div class="bg-black text-white px-3 py-2 rounded-xl border-[2px] border-black font-black shadow-[4px_4px_0_0_#ffc480] whitespace-nowrap flex flex-col items-center">
													<span class="text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-1.5">{new Date(stat.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})}</span>
													<span class="text-sm leading-none">{formatNumber(stat.hits)} <span class="text-gray-400 font-bold ml-1">views</span></span>
												</div>
											</div>
											
											<!-- The Bar -->
											<div class="w-full bg-[#c4b5fd] border-[2px] border-b-0 border-black rounded-t-sm transition-all duration-300 group-hover:bg-[#a78bfa] group-hover:-translate-y-1 relative overflow-hidden"
												 style="height: {Math.max((stat.hits / chartMax) * 100, 1)}%"
											>
												 <!-- Grid pattern overlay inside the bar for texture -->
												 <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.15)_25%,rgba(0,0,0,0.15)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.15)_75%,rgba(0,0,0,0.15)_100%)] [background-size:6px_6px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
												 <!-- White top edge highlight -->
												 <div class="w-full h-1 bg-white/40 border-b border-black/20"></div>
											</div>
										 </div>
									{/each}
								</div>
							</div>
							
							<!-- X-Axis Labels (Dates) -->
							<div class="flex justify-between items-center mt-3 z-10 px-1 pr-12 sm:pr-16">
								<div class="bg-white rounded-md border-[2px] border-black shadow-[2px_2px_0_0_black] px-2 py-1 text-[10px] font-black text-black uppercase tracking-widest">{new Date(filteredDailyStats[0].date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})}</div>
								<div class="bg-white rounded-md border-[2px] border-black shadow-[2px_2px_0_0_black] px-2 py-1 text-[10px] font-black text-black uppercase tracking-widest">{new Date(filteredDailyStats[filteredDailyStats.length-1].date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'})}</div>
							</div>
						{:else}
							<div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-white/50 backdrop-blur-sm">
								<div class="w-16 h-16 bg-white rounded-2xl border-[3px] border-black flex items-center justify-center mb-4 shadow-[4px_4px_0_0_black] rotate-3">
									<svg class="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
									</svg>
								</div>
								<p class="text-sm font-black text-black uppercase tracking-wider">No traffic in this period</p>
							</div>
						{/if}
					</div>

					<!-- Top Referrers + Countries Side by Side -->
					{#if $cdnStore.topReferrers.length > 0 || $cdnStore.topCountries.length > 0}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t-[3px] border-black bg-white flex-shrink-0">
							{#if $cdnStore.topReferrers.length > 0}
								<div class="p-5 sm:p-6 border-b-[3px] border-black sm:border-b-0 sm:border-r-[3px]">
									<h4 class="text-[10px] font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
										<div class="w-2 h-2 bg-[#ffc480] border-[2px] border-black rounded-sm"></div>
										Top Referrers
									</h4>
									<div class="space-y-2">
										{#each $cdnStore.topReferrers.slice(0, 5) as ref}
											<div class="flex items-center justify-between text-xs group">
												<span class="font-bold text-gray-600 truncate max-w-[150px] lg:max-w-[180px] group-hover:text-black transition-colors">{ref.referrer || 'Direct'}</span>
												<span class="font-black text-black bg-gray-100 px-2 py-0.5 rounded border-[2px] border-black shadow-[1px_1px_0_0_black] group-hover:-translate-y-0.5 group-hover:shadow-[2px_2px_0_0_black] transition-all">{formatNumber(ref.hits)}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
							{#if $cdnStore.topCountries.length > 0}
								<div class="p-5 sm:p-6">
									<h4 class="text-[10px] font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
										<div class="w-2 h-2 bg-[#4ade80] border-[2px] border-black rounded-sm"></div>
										Top Countries
									</h4>
									<div class="space-y-2">
										{#each $cdnStore.topCountries.slice(0, 5) as country}
											<div class="flex items-center justify-between text-xs group">
												<span class="font-bold text-gray-600 truncate max-w-[150px] lg:max-w-[180px] group-hover:text-black transition-colors">{country.country}</span>
												<span class="font-black text-black bg-gray-100 px-2 py-0.5 rounded border-[2px] border-black shadow-[1px_1px_0_0_black] group-hover:-translate-y-0.5 group-hover:shadow-[2px_2px_0_0_black] transition-all">{formatNumber(country.hits)}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<div class="lg:col-span-4 flex flex-col justify-center">
				<!-- Quick Actions — Feature Discovery -->
		<div class="flex flex-col mb-0">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3">
					<span class="w-3 h-3 bg-[#a78bfa] rounded-sm border-[2px] border-black"></span>
					Quick Actions
				</h2>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
				<!-- Bulk Render -->
				<a href="/dashboard/template" class="group bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0_0_black] p-3 hover:shadow-[1px_1px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center text-center">
					<div class="w-9 h-9 bg-[#ff6b6b]/15 rounded-lg border-[2px] border-[#ff6b6b] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
						<svg class="w-5 h-5 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
						</svg>
					</div>
					<span class="text-xs font-black text-black uppercase tracking-wider">Bulk Render</span>
					<span class="text-[10px] font-bold text-gray-500 mt-1 leading-tight hidden sm:block lg:hidden xl:block">Generate 100s of images from a CSV</span>
				</a>

				<!-- Live Links -->
				<a href="/dashboard/template" class="group bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0_0_black] p-3 hover:shadow-[1px_1px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center text-center">
					<div class="w-9 h-9 bg-[#3b82f6]/15 rounded-lg border-[2px] border-[#3b82f6] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
						<svg class="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
						</svg>
					</div>
					<span class="text-xs font-black text-black uppercase tracking-wider">Live Links</span>
					<span class="text-[10px] font-bold text-gray-500 mt-1 leading-tight hidden sm:block lg:hidden xl:block">Live images that update via URL params</span>
				</a>

				<!-- A/B Test -->
				<a href="/dashboard/experiments/create?type=ab_test" class="group bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0_0_black] p-3 hover:shadow-[1px_1px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center text-center">
					<div class="w-9 h-9 bg-[#f59e0b]/15 rounded-lg border-[2px] border-[#f59e0b] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
						<svg class="w-5 h-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
						</svg>
					</div>
					<span class="text-xs font-black text-black uppercase tracking-wider">A/B Test</span>
					<span class="text-[10px] font-bold text-gray-500 mt-1 leading-tight hidden sm:block lg:hidden xl:block">Test image variants to find the best</span>
				</a>

				<!-- Smart Links -->
				<a href="/dashboard/experiments/create?type=smart_link" class="group bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0_0_black] p-3 hover:shadow-[1px_1px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center text-center">
					<div class="w-9 h-9 bg-[#4ade80]/15 rounded-lg border-[2px] border-[#4ade80] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
						<svg class="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
						</svg>
					</div>
					<span class="text-xs font-black text-black uppercase tracking-wider">Smart Links</span>
					<span class="text-[10px] font-bold text-gray-500 mt-1 leading-tight hidden sm:block lg:hidden xl:block">Route viewers to the best-performing link</span>
				</a>

				<!-- Scheduled Images -->
				<a href="/dashboard/experiments/create?type=scheduled" class="group bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0_0_black] p-3 hover:shadow-[1px_1px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center text-center">
					<div class="w-9 h-9 bg-[#a78bfa]/15 rounded-lg border-[2px] border-[#a78bfa] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
						<svg class="w-5 h-5 text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<span class="text-xs font-black text-black uppercase tracking-wider">Scheduled</span>
					<span class="text-[10px] font-bold text-gray-500 mt-1 leading-tight hidden sm:block lg:hidden xl:block">Auto-swap images on a schedule</span>
				</a>

				<!-- Auto-Optimize (opt-in on A/B test) -->
				<a href="/dashboard/experiments/create" class="group bg-white rounded-xl border-[3px] border-black shadow-[3px_3px_0_0_black] p-3 hover:shadow-[1px_1px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center text-center">
					<div class="w-9 h-9 bg-[#a855f7]/15 rounded-lg border-[2px] border-[#a855f7] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
						<svg class="w-5 h-5 text-[#a855f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
						</svg>
					</div>
					<span class="text-xs font-black text-black uppercase tracking-wider">Auto-Optimize</span>
					<span class="text-[10px] font-bold text-gray-500 mt-1 leading-tight hidden sm:block lg:hidden xl:block">Enable on any A/B test to auto-pick winners</span>
				</a>
			</div>
		</div>
			</div>

			<!-- ROW 2: Continue Working + Top Templates -->
			<div class="lg:col-span-8 flex flex-col h-full">
				<!-- Continue Working Section -->
		<div class="flex-1 flex flex-col mb-0">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3">
					<span class="w-3 h-3 bg-[#4ade80] rounded-sm border-[2px] border-black rotate-45"></span>
					Continue Working
				</h2>
				{#if recentTemplates.length > 0}
					<a href="/dashboard/template" class="text-xs font-black text-[#ff6b6b] uppercase tracking-wider hover:text-[#ff5252] flex items-center gap-1 group">
						View all templates
						<svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
					</a>
				{/if}
			</div>

			<div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
				{#if recentTemplates.length > 0}
					{#each recentTemplates.slice(0, 4) as template}
						<a
							href="/dashboard/template/{template.uid}"
							class="group bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden hover:shadow-[4px_4px_0_0_black] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex flex-col h-full"
						>
							<div class="aspect-video bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] border-b-[3px] border-black relative overflow-hidden flex-shrink-0">
								{#if template.thumbnail}
									<img src={template.thumbnail} alt={template.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
								{:else}
									<div class="w-full h-full flex items-center justify-center bg-gray-50 group-hover:bg-[#ffc480]/10 transition-colors">
										<svg class="w-8 h-8 text-gray-400 group-hover:text-[#ffc480] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"/>
										</svg>
									</div>
								{/if}
								<!-- Overlay Action -->
								<div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
									<div class="bg-[#ffc480] text-black text-xs font-black uppercase tracking-wider px-4 py-2 rounded-full border-[2px] border-black transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
										Open Editor
									</div>
								</div>
							</div>
							<div class="p-4 md:p-5 flex-1 flex flex-col justify-center">
								<h4 class="text-base font-black text-black truncate mb-1">{template.name || 'Untitled'}</h4>
								<div class="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
									{#if template.outputFormat}
										<span class="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-gray-700">{template.outputFormat}</span>
									{/if}
									<span>{template.updatedAt ? timeAgo(template.updatedAt) : template.createdAt ? timeAgo(template.createdAt) : ''}</span>
								</div>
							</div>
						</a>
					{/each}
				{:else}
					<!-- Empty State -->
					<div class="col-span-full">
						<div class="bg-white rounded-3xl border-[3px] border-black border-dashed p-12 text-center flex flex-col items-center justify-center">
							<div class="w-16 h-16 bg-gray-100 rounded-2xl border-[3px] border-gray-300 flex items-center justify-center mb-4 transform -rotate-3">
								<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"/>
								</svg>
							</div>
							<p class="text-lg font-black text-black mb-2">No templates yet</p>
							<p class="text-sm font-bold text-gray-500 mb-6 max-w-sm">Create your first template to start generating automated images and GIFs.</p>
							<a href="/dashboard/template/create" class="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors">
								Create Template
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
			</div>
			<div class="lg:col-span-4 flex flex-col h-full">
				<!-- Top Performing Templates -->
				<div class="bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden flex flex-col h-full">
					<div class="flex items-center justify-between p-5 md:p-6 border-b-[3px] border-black bg-gray-50 flex-shrink-0">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-xl bg-yellow-200 border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0_0_black]">
								<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
								</svg>
							</div>
							<span class="text-xs font-black text-black uppercase tracking-widest">Top Templates</span>
						</div>
					</div>
					
					<div class="divide-y-[2px] divide-black flex-1 overflow-y-auto">
						{#if $cdnStore.topTemplates && $cdnStore.topTemplates.length > 0}
							{#each $cdnStore.topTemplates as tpl, i}
								<a href="/dashboard/template/{tpl.uid}" class="flex items-center gap-4 p-4 hover:bg-[#ffc480]/20 transition-colors group">
									<!-- Rank -->
									<div class="w-6 font-black text-gray-400 text-sm group-hover:text-black transition-colors">#{i + 1}</div>
									
									<!-- Thumbnail -->
									<div class="w-12 h-12 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] rounded-xl border-[2px] border-black flex-shrink-0 overflow-hidden shadow-[2px_2px_0_0_black] group-hover:shadow-[4px_4px_0_0_black] group-hover:-translate-y-0.5 transition-all">
										{#if tpl.thumbnail}
											<img src={tpl.thumbnail} alt={tpl.name} class="w-full h-full object-cover" />
										{:else}
											<div class="w-full h-full flex items-center justify-center bg-gray-50">
												<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"/>
												</svg>
											</div>
										{/if}
									</div>
									
									<!-- Info -->
									<div class="flex-1 min-w-0 transition-transform duration-200 group-hover:translate-x-1">
										<h4 class="text-sm font-black text-black truncate">{tpl.name}</h4>
										<p class="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wide">
											{formatNumber(tpl.hits)} {tpl.hits === 1 ? 'view' : 'views'}
										</p>
									</div>
								</a>
							{/each}
						{:else}
							<div class="p-8 text-center flex flex-col items-center justify-center h-full">
								<div class="w-12 h-12 bg-gray-100 rounded-xl border-[2px] border-gray-300 flex items-center justify-center mb-3">
									<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
									</svg>
								</div>
								<p class="text-sm font-bold text-gray-900">No views yet</p>
								<p class="text-xs text-gray-500 mt-1">Share your generated images to see which templates perform best</p>
							</div>
						{/if}
					</div>
				</div>

			</div>
		</div>
	{/if}
</section>
