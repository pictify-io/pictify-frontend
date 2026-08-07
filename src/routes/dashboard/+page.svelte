<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '../../store/user.store';
	import { plgStatus, PLAN_DISPLAY_NAMES } from '../../store/plg.store';
	import { cdnStore, initCdnAnalytics } from '../../store/cdn.store';
	import { teamStore, currentTeam } from '../../store/team.store';
	import {
		onboardingStore,
		showOnboarding,
		showWelcomeWizard,
		initOnboarding,
		completeStepAction,
		dismissOnboardingAction,
		toggleOnboardingCollapse,
		personalization
	} from '../../store/onboarding.store';
	import { fetchAuditLogs } from '../../api/audit';
	import { getWorkflowStats, listWorkflowRuns } from '../../api/workflow';
	import RecentRuns from '$lib/components/dashboard/RecentRuns.svelte';
	import { getTemplates } from '../../api/template';
	import SnippetThumbnail from '$lib/components/editor/html/SnippetThumbnail.svelte';
	import { getApiToken, createApiToken } from '../../api/user';
	import { analytics } from '$lib/analytics.js';
	import {
		getQuickActions,
		getWelcomeMessage,
		getEmptyStateMessage,
		getPrimaryCTA,
		STARTER_TEMPLATES
	} from '../../config/personalization.js';
	import { evaluateNudges, getDismissedNudges, dismissNudge } from '$lib/utils/nudge-engine.js';
	import NudgeBanner from '$lib/components/dashboard/NudgeBanner.svelte';
	import GettingStartedGuide from '$lib/components/onboarding/GettingStartedGuide.svelte';
	import WelcomeWizard from '$lib/components/onboarding/WelcomeWizard.svelte';
	import Skeleton from '$lib/components/dashboard/Skeleton.svelte';
	import { browser } from '$app/environment';
	import posthog from 'posthog-js';

	let isLoading = true;
	let guideDismissed = false;
	// Experiment: dashboard-checklist-value-first (SEQUENCED — flag dormant, defaults to control).
	let checklistVariant = 'control';
	let recentLogs = [];
	let recentTemplates = [];
	let totalTemplates = 0;
	let workflowStats = { totalRuns: 0, documentsRendered: 0, documentsDelivered: 0 };
	let recentRuns = [];

	// Last 14 days for the compact sparkline. dailyStats is oldest-first.
	$: sparkStats = ($cdnStore.dailyStats || []).slice(-14);
	$: sparkMax = sparkStats.reduce((max, d) => Math.max(max, d.hits || 0), 0);
	// The sparkline shows shape; this gives it a magnitude.
	$: spark14Total = sparkStats.reduce((sum, d) => sum + (d.hits || 0), 0);
	// Prior 14-day window, for a like-for-like trend. Null when there isn't a
	// full previous window to compare against, so we never show a fake +100%.
	$: prev14Stats = ($cdnStore.dailyStats || []).slice(-28, -14);
	$: prev14Total = prev14Stats.reduce((sum, d) => sum + (d.hits || 0), 0);
	$: trendPct =
		prev14Stats.length > 0 && prev14Total > 0
			? Math.round(((spark14Total - prev14Total) / prev14Total) * 100)
			: null;

	let nudges = [];
	let userApiKey = '';

	// Filtered daily stats based on time range
	$: planName = PLAN_DISPLAY_NAMES[$plgStatus.plan] || 'Starter';
	$: teamName = $currentTeam?.name || 'My Workspace';
	$: memberCount = $teamStore?.members?.length || 1;

	// Personalization
	$: useCase = $personalization?.useCase;
	$: isPersonalized = !!useCase;
	$: welcomeMsg = useCase ? getWelcomeMessage(useCase) : null;
	$: quickActions = getQuickActions(useCase);
	$: emptyMsg = useCase ? getEmptyStateMessage(useCase) : null;
	$: integrationMode = $personalization?.integrationMode;
	$: primaryCTA = getPrimaryCTA(useCase, integrationMode);
	$: isNewUser = isPersonalized && totalTemplates < 2;
	$: starterTemplateIds = useCase ? STARTER_TEMPLATES[useCase] || [] : [];

	// Getting Started Guide
	$: guideHasApiKey = ($onboardingStore.steps || []).some(
		(s) => s.id === 'get_api_key' && s.completed
	);
	$: guideHasTemplates = totalTemplates > 0;
	$: guideHasImages = ($onboardingStore.steps || []).some(
		(s) => s.id === 'first_image' && s.completed
	);
	$: guideIntent = $personalization?.useCase || null;
	$: showGuide = !guideDismissed && totalTemplates < 3;

	function handleDismissGuide() {
		guideDismissed = true;
		if (browser) {
			localStorage.setItem('pictify_guide_dismissed', 'true');
		}
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
			image:
				'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			gif: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
			pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
			template:
				'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z',
			auth: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
			api: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
			batch:
				'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
			webhook: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101',
			connector: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101'
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
			batch: 'bg-orange-100 text-orange-700 border-orange-700'
		};
		return colors[category] || 'bg-gray-100 text-gray-700 border-gray-700';
	}

	function getStatusDot(status) {
		if (status === 'success') return 'bg-data-green';
		if (status === 'failure') return 'bg-brand-danger';
		return 'bg-brand-accent';
	}

	function handleDismissNudge(id) {
		dismissNudge(id);
		nudges = nudges.filter((n) => n.id !== id);
	}

	onMount(async () => {
		analytics.page('Dashboard Home');
		// Fire the canonical dashboard_page_viewed event on the main dashboard route.
		// Previously only dashboard SUB-pages called this, so the funnel showed ~0%
		// dashboard reach for signups — a measurement gap, not real behaviour.
		analytics.trackDashboardPage({ page_name: 'dashboard_home' });

		// Resolve the dashboard-checklist-value-first experiment variant once flags load.
		const resolveChecklistVariant = () => {
			try {
				checklistVariant = posthog.getFeatureFlag?.('dashboard-checklist-value-first') || 'control';
			} catch {
				checklistVariant = 'control';
			}
		};
		if (typeof posthog.onFeatureFlags === 'function') {
			posthog.onFeatureFlags(resolveChecklistVariant);
		} else {
			resolveChecklistVariant();
		}

		// Check if Getting Started Guide was previously dismissed
		if (browser) {
			guideDismissed = localStorage.getItem('pictify_guide_dismissed') === 'true';
		}

		try {
			// Fetch data in parallel
			const [cdnData, logsData, templatesData, apiTokenData, wfStats, runsData] = await Promise.all([
				initCdnAnalytics(),
				fetchAuditLogs({ limit: 8 }).catch(() => ({ logs: [] })),
				getTemplates({ page: 1, limit: 6, sort: 'newest' }).catch(() => null),
				getApiToken().catch(() => null),
				getWorkflowStats(),
				listWorkflowRuns().catch(() => ({ runs: [] }))
			]);
			workflowStats = wfStats;
			recentRuns = (runsData?.runs || []).slice(0, 6);

			// Extract API key for getting started guide, auto-create if none exists
			if (apiTokenData?.apiTokens?.length) {
				userApiKey = apiTokenData.apiTokens[0].token || '';
			} else {
				try {
					const created = await createApiToken();
					userApiKey = created?.token || '';
				} catch {
					// Non-critical — user can create later
				}
			}

			recentLogs = logsData?.logs || [];
			recentTemplates = templatesData?.templates || [];
			totalTemplates = templatesData?.pagination?.total || recentTemplates.length;

			// Evaluate nudges
			const onb = $onboardingStore;
			const completedStepIds = (onb.steps || []).filter((s) => s.completed).map((s) => s.id);
			nudges = evaluateNudges(
				{
					templateCount: totalTemplates,
					integrationMode: onb.personalization?.integrationMode || null,
					hasApiKey: completedStepIds.includes('get_api_key'),
					hasBulkRendered: false
				},
				getDismissedNudges()
			);
		} catch (error) {
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
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none -z-10"
	/>

	<!-- Welcome Header & Primary Action -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12 pt-4">
		<div>
			<div
				class="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-accent border-[3px] border-black shadow-brutal-lg rounded-full transform -rotate-1 mb-6"
			>
				<span class="w-2 h-2 bg-data-green rounded-full border border-black" />
				<span class="text-xs font-black text-black uppercase tracking-widest">Command Center</span>
			</div>
			{#if welcomeMsg && totalTemplates === 0}
				<h1
					class="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-black text-black tracking-tighter leading-[0.95]"
				>
					{welcomeMsg.title}
				</h1>
				<p class="text-base sm:text-lg font-bold text-gray-500 mt-3 max-w-lg">
					{welcomeMsg.subtitle}
				</p>
			{:else}
				<h1
					class="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-black text-black tracking-tighter leading-[0.95]"
				>
					Welcome back.
				</h1>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			<a
				href={primaryCTA?.href || '/dashboard/workflows/new'}
				class="group flex items-center gap-3 bg-brand-danger border-[3px] border-black shadow-brutal-xl rounded-2xl px-6 py-3 md:px-8 md:py-4 hover:shadow-brutal-sm hover:translate-x-[4px] hover:translate-y-[4px] transform hover:rotate-1 transition-all duration-200"
			>
				<span class="text-white font-black text-lg uppercase tracking-wide"
					>{primaryCTA?.label || 'Start a run'}</span
				>
				<div
					class="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl border-[3px] border-black flex items-center justify-center group-hover:rotate-12 transition-transform shadow-brutal-sm"
				>
					<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if integrationMode === 'api'}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M12 4v16m8-8H4"
							/>
						{/if}
					</svg>
				</div>
			</a>
		</div>
	</div>

	<!-- Getting Started Guide (new users only) -->
	{#if showGuide && !isLoading}
		<div class="mb-10">
			<GettingStartedGuide
				hasApiKey={guideHasApiKey}
				hasTemplates={guideHasTemplates}
				hasImages={guideHasImages}
				intent={guideIntent}
				apiKey={userApiKey}
				variant={checklistVariant}
				on:dismiss={handleDismissGuide}
			/>
		</div>
	{/if}

	{#if isLoading}
		<!-- Skeleton: 3 stat cards + chart placeholder + 4 template cards -->
		<div class="mb-12">
			<Skeleton class="h-4 w-40 mb-6" />
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				{#each Array(3) as _}
					<Skeleton class="h-32 rounded-2xl border-[3px] border-gray-200" />
				{/each}
			</div>
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-12">
			<div class="lg:col-span-8">
				<Skeleton class="h-[400px] rounded-2xl border-[3px] border-gray-200" />
			</div>
			<div class="lg:col-span-4">
				<Skeleton class="h-[400px] rounded-2xl border-[3px] border-gray-200" />
			</div>
			<div class="lg:col-span-8">
				<Skeleton class="h-4 w-40 mb-6" />
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					{#each Array(4) as _}
						<Skeleton class="h-52 rounded-2xl border-[3px] border-gray-200" />
					{/each}
				</div>
			</div>
			<div class="lg:col-span-4">
				<Skeleton class="h-52 rounded-2xl border-[3px] border-gray-200" />
			</div>
		</div>
	{:else}
		<!-- Recommended For You (new personalized users only) -->
		{#if isNewUser && starterTemplateIds.length > 0}
			<div class="mb-12">
				<div class="flex items-center gap-3 mb-6">
					<h2
						class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
					>
						<span class="w-3 h-3 bg-brand-accent rounded-full border-[2px] border-black" />
						Recommended For You
					</h2>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{#each starterTemplateIds.slice(0, 3) as templateId}
						<a
							href="/template-workspace/html/create?engine=html"
							class="group bg-white rounded-2xl border-[3px] border-black shadow-brutal-lg overflow-hidden hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							<!-- Template Preview -->
							<div
								class="aspect-[4/3] bg-[radial-gradient(circle_at_30%_30%,#f8f8f8,#e8e8e8)] overflow-hidden relative"
							>
								<div class="w-full h-full flex items-center justify-center">
									<div
										class="w-14 h-14 bg-brand-accent/20 rounded-xl border-[2px] border-brand-accent flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform"
									>
										<svg
											class="w-7 h-7 text-brand-accent"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
											/>
										</svg>
									</div>
								</div>
							</div>
							<!-- Label -->
							<div class="px-4 py-3 border-t-[3px] border-black">
								<span class="text-sm font-black text-black capitalize"
									>{templateId.replace(/-/g, ' ')}</span
								>
								<span class="block text-xs font-bold text-gray-500 mt-0.5">Try this template</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Nudge Banners -->
		{#if nudges.length > 0}
			<div class="flex flex-col gap-3 mb-8">
				{#each nudges as nudge (nudge.id)}
					<NudgeBanner
						message={nudge.message}
						cta={nudge.cta}
						href={nudge.href}
						on:dismiss={() => handleDismissNudge(nudge.id)}
					/>
				{/each}
			</div>
		{/if}

		<!-- 1. Pulse Metrics (Top Full-Width) -->
		<!-- Performance Command Center -->
		<div class="mb-12">
			<div class="flex items-center gap-3 mb-6">
				<h2
					class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
				>
					<span class="w-3 h-3 bg-brand-danger rounded-full border-[2px] border-black" />
					Performance Analytics
				</h2>
			</div>

			<!-- Analytics Layout: top row aggregated metrics, then chart + quick actions -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Aggregated Metric: Views -->
				<div
					class="bg-brand-accent rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col justify-center relative overflow-hidden group"
				>
					<!-- Geometric background shape -->
					<div
						class="absolute -right-12 -top-12 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-700"
					/>
					<div class="relative z-10">
						<div
							class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2"
						>
							Total Views
						</div>
						<div
							class="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter leading-none"
						>
							{formatNumber($cdnStore.totalHits)}
						</div>
					</div>
				</div>

				<!-- Aggregated Metric: Templates -->
				<div
					class="bg-indigo-300 rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col justify-center relative overflow-hidden group"
				>
					<!-- Geometric background shape -->
					<div
						class="absolute -right-6 -bottom-6 w-32 h-32 bg-black/5 transform rotate-12 group-hover:rotate-45 transition-transform duration-700"
					/>
					<div class="relative z-10">
						<div
							class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2"
						>
							Total Templates
						</div>
						<div
							class="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter leading-none"
						>
							{totalTemplates}
						</div>
					</div>
				</div>

				<!-- Aggregated Metric: Assets -->
				<div
					class="bg-data-green rounded-2xl border-[3px] border-black shadow-brutal-2xl p-6 flex flex-col justify-center relative overflow-hidden group"
				>
					<!-- Geometric background shape -->
					<div
						class="absolute -left-10 -bottom-10 w-36 h-36 bg-white/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"
					/>
					<div class="relative z-10">
						<div
							class="text-[10px] md:text-xs font-black text-black/70 uppercase tracking-widest mb-2"
						>
							Workflow Runs
						</div>
						<div
							class="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter leading-none"
						>
							{formatNumber(workflowStats.totalRuns)}
						</div>
						<div class="text-[10px] font-bold text-black/50 mt-2 uppercase tracking-wider">
							{formatNumber(workflowStats.documentsDelivered)} delivered
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Main Split -->
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-12 items-start">
			<!-- ROW 1: Chart + Quick Actions -->
			<!-- Render activity — compact. The full chart, referrers and countries
				 live at /dashboard/analytics; duplicating them here buried the run
				 loop under the old image-API product. -->
			<div class="lg:col-span-8 flex flex-col lg:self-stretch">
				<!-- Heading sits OUTSIDE the card, matching Quick Actions and Recent
					 runs, so all three section titles share one baseline. -->
				<div class="flex items-center justify-between mb-6 gap-4 min-h-[38px]">
					<h2
						class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
					>
						<span class="w-3 h-3 bg-data-blue rounded-sm border-[2px] border-black rotate-45" />
						Render activity
					</h2>
					<a
						href="/dashboard/analytics"
						class="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border-[3px] border-black shadow-brutal-sm hover:shadow-brutal-md hover:-translate-y-0.5 transition-all focus-brutal"
					>
						View analytics
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
						</svg>
					</a>
				</div>

				<div
					class="bg-white rounded-2xl border-[3px] border-black shadow-brutal-md p-5 md:p-6 flex-1 flex items-center"
				>
					<div class="flex items-center gap-6 lg:gap-8 w-full">
						<div class="shrink-0 flex flex-col gap-5">
							<div>
								<div
									class="text-3xl font-black text-black tracking-tighter leading-none tabular-nums"
								>
									{formatNumber($cdnStore.totalHits)}
								</div>
								<div class="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1.5">
									Views all time
								</div>
							</div>

							<div class="pt-5 border-t-[3px] border-black">
								<div class="flex items-baseline gap-2">
									<span
										class="text-3xl font-black text-black tracking-tighter leading-none tabular-nums"
									>
										{formatNumber(spark14Total)}
									</span>
									{#if trendPct !== null}
										<span
											class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black tabular-nums {trendPct >=
											0
												? 'bg-data-green text-black'
												: 'bg-brand-danger/20 text-black'}"
										>
											{trendPct >= 0 ? '+' : ''}{trendPct}%
										</span>
									{/if}
								</div>
								<div class="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1.5">
									Last 14 days
								</div>
							</div>
						</div>

						<!-- Sparkline: last 14 days of delivery, drawn from the same
							 dailyStats the analytics page uses. -->
						{#if sparkStats.length > 1}
							<div class="flex-1 flex items-end gap-[3px] h-14 lg:h-20" aria-hidden="true">
								{#each sparkStats as day}
									<div
										class="flex-1 bg-data-blue border-[1.5px] border-black rounded-sm min-h-[3px] transition-all duration-200"
										style="height: {sparkMax > 0 ? Math.max(6, (day.hits / sparkMax) * 100) : 6}%"
										title="{day.date}: {day.hits} views"
									/>
								{/each}
							</div>
							<div class="shrink-0 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
								14d
							</div>
						{:else}
							<p class="flex-1 text-xs font-bold text-gray-500">
								No render traffic yet. Assets you render through a template or the API show up here.
							</p>
						{/if}
					</div>
				</div>
			</div>
			<div class="lg:col-span-4 flex flex-col lg:self-stretch">
				<!-- Quick Actions — Feature Discovery (personalized order) -->
				<div class="flex flex-col flex-1">
					<div class="flex items-center justify-between mb-6 min-h-[38px]">
						<h2
							class="text-sm md:text-base font-black text-black uppercase tracking-widest flex items-center gap-3"
						>
							<span class="w-3 h-3 bg-data-violet rounded-sm border-[2px] border-black" />
							Quick Actions
						</h2>
					</div>

					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
						{#each quickActions as action}
							<a
								href={action.href}
								class="group bg-white rounded-xl border-[3px] border-black shadow-brutal-md p-3 hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col items-center text-center"
							>
								<div
									class="w-9 h-9 rounded-lg border-[2px] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform"
									style="background-color: {action.color}15; border-color: {action.color}"
								>
									<svg
										class="w-5 h-5"
										style="color: {action.color}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										{#if action.icon === 'batch'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											/>
										{:else if action.icon === 'link'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
											/>
										{:else if action.icon === 'chart'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
											/>
										{:else if action.icon === 'shield'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
											/>
										{:else if action.icon === 'clock'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										{:else if action.icon === 'lightning'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										{:else if action.icon === 'code'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
											/>
										{:else if action.icon === 'key'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
											/>
										{:else if action.icon === 'video'}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									{:else if action.icon === 'plus'}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M12 4v16m8-8H4"
											/>
										{:else}
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										{/if}
									</svg>
								</div>
								<span class="text-xs font-black text-black uppercase tracking-wider"
									>{action.label}</span
								>
								<span
									class="text-[10px] font-bold text-gray-500 mt-1 leading-tight hidden sm:block lg:hidden xl:block"
									>{action.desc}</span
								>
							</a>
						{/each}
					</div>
				</div>
			</div>

			<!-- ROW 2: Continue Working (full width — the "Top Performing
				 Templates" panel was removed 2026-08) -->
			<!-- Recent runs — the page's primary content. "Did my documents go out?"
				 is the question this product answers; nothing rendered it before. -->
			<!-- Recent runs — the page's primary content. "Did my documents go out?"
				 is the question this product answers; nothing rendered it before. -->
			<div class="lg:col-span-12 flex flex-col">
				<RecentRuns runs={recentRuns} />
			</div>
		</div>
	{/if}
</section>

<!-- Intent Wizard (full-screen overlay for new users) -->
{#if $showWelcomeWizard}
	<WelcomeWizard />
{/if}
