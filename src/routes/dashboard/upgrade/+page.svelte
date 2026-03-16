<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { user } from '../../../store/user.store';
	import { getProducts } from '../../../api/product';
	import Loader from '$lib/components/Loader.svelte';
	import { analytics } from '$lib/analytics.js';
	import { PLANS, FEATURES, PLAN_FEATURES, formatLimit } from '../../../config/plan-features.js';

	let isLoading = true;
	let allPlans = [];
	let error = null;
	let showAnnual = false;

	$: isLoggedIn = !!$user.email;
	$: currentPlan = $user.currentPlan || 'starter';
	$: isFreeTier = currentPlan.toLowerCase() === 'starter';

	// Read discount code from URL params (only apply for free tier users)
	$: discountCodeParam = $page.url.searchParams.get('discount');
	$: discountCode = isFreeTier ? discountCodeParam : null;
	$: source = $page.url.searchParams.get('source');

	// Read billing preference from URL (from pricing page)
	$: billingParam = $page.url.searchParams.get('billing');
	$: if (billingParam === 'annual' && !showAnnual) {
		showAnnual = true;
	}

	// 3-tier system matching pricing page: Free (Starter), Pro (Standard), Business
	// Legacy plans (Basic, Professional) are excluded — only for grandfathered users
	const legacyPlanNames = ['Basic', 'Professional'];
	const featuredPlanNames = ['Standard', 'Business'];

	$: featuredPlans = allPlans
		.filter((p) => !legacyPlanNames.includes(p.name))
		.filter((p) => featuredPlanNames.includes(p.name));

	// Get plan features from central config
	function getQuotas(planName) {
		const planId = planName?.toLowerCase();
		const features = PLAN_FEATURES[planId] || PLAN_FEATURES[PLANS.STARTER];
		return {
			renders: features[FEATURES.RENDERS],
			templates: features[FEATURES.TEMPLATES_SAVED],
			aiCopilot: features[FEATURES.AI_COPILOT],
			aiBackgroundRemover: features[FEATURES.AI_BACKGROUND_REMOVER],
			batchRender: features[FEATURES.BATCH_RENDER],
			teamSeats: features[FEATURES.TEAM_SEATS]
		};
	}

	// Format feature value for display
	function formatFeatureValue(value) {
		if (value === null) return '∞';
		if (value === true) return '✓';
		if (value === false) return '—';
		return formatLimit(value);
	}

	onMount(async () => {
		// Track pricing page view from dashboard
		analytics.trackPricingViewed({ source: 'dashboard_upgrade' });

		try {
			const response = await getProducts();
			allPlans = (response?.data ?? [])
				.filter((plan) => plan && typeof plan.request_per_month === 'number')
				.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
		} catch (err) {
			error = 'Failed to load pricing plans. Please try again.';
		} finally {
			isLoading = false;
		}
	});

	function formatRequests(value) {
		const numeric = typeof value === 'number' ? value : Number(value ?? 0);
		if (Number.isNaN(numeric)) return '-';
		if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(0)}M`;
		if (numeric >= 1_000) return `${(numeric / 1_000).toFixed(numeric % 1_000 === 0 ? 0 : 1)}K`;
		return numeric.toString();
	}

	function isPlanCurrent(plan) {
		return plan?.name?.toLowerCase() === currentPlan?.toLowerCase();
	}

	function handlePurchase(plan) {
		if (!plan) return;

		// Use annual URL if available and annual billing is selected
		const purchaseUrl =
			showAnnual && plan.purchase_url_annual ? plan.purchase_url_annual : plan.purchase_url;

		// Track upgrade started
		analytics.trackUpgradeStarted({
			plan: plan.name,
			source: source || 'dashboard_upgrade',
			price: plan.price,
			requests: plan.request_per_month,
			current_plan: currentPlan,
			discount_code: discountCode,
			billing_interval: showAnnual ? 'annual' : 'monthly'
		});

		if (!isLoggedIn) {
			window.location.href = `/signup?redirect=${purchaseUrl ?? '/dashboard/api-token'}`;
			return;
		}
		if (purchaseUrl) {
			let checkoutUrl = purchaseUrl;

			// Append custom data for reliable user identification in webhooks
			// This ensures the webhook knows which user/team to update, avoiding email mismatch issues
			const customParams = [];

			// Always include user ID for reliable webhook processing
			if ($user._id) {
				customParams.push(`checkout[custom][user_id]=${encodeURIComponent($user._id)}`);
			}

			// Include team UID if user is on a team
			if ($user.activeTeam) {
				customParams.push(`checkout[custom][team_uid]=${encodeURIComponent($user.activeTeam)}`);
			}

			// Append discount code to LemonSqueezy checkout URL if present
			if (discountCode) {
				customParams.push(`checkout[discount_code]=${encodeURIComponent(discountCode)}`);
			}

			// Join all parameters with the checkout URL
			if (customParams.length > 0) {
				const separator = checkoutUrl.includes('?') ? '&' : '?';
				checkoutUrl = `${checkoutUrl}${separator}${customParams.join('&')}`;
			}

			window.location.href = checkoutUrl;
		} else {
			goto('/dashboard/api-token');
		}
	}
</script>

<svelte:head>
	<title>Upgrade Plan - Pictify.io</title>
</svelte:head>

<section class="min-h-full max-w-5xl mx-auto flex flex-col pt-4">
	<!-- Discount Banner -->
	{#if discountCode}
		<div
			class="mb-8 p-4 bg-[#10b981]/10 border-[3px] border-[#10b981] rounded-2xl flex items-center gap-4 shadow-[4px_4px_0_0_#10b981]"
		>
			<div
				class="w-12 h-12 bg-[#10b981] rounded-xl border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]"
			>
				<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
					/>
				</svg>
			</div>
			<div>
				<p class="font-black text-gray-900 text-lg uppercase tracking-tight">
					Code Applied: <span class="text-[#10b981]">{discountCode}</span>
				</p>
				<p class="text-sm font-bold text-gray-600">
					Your discount will be applied at checkout automatically.
				</p>
			</div>
		</div>
	{/if}

	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
		<div>
			<div
				class="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3"
			>
				<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ffc480] rounded-full animate-pulse" />
				Pricing Plans
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2">
				Upgrade Your <span
					class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600"
					>Plan</span
				>
			</h1>
			<p class="text-gray-600 font-bold text-sm sm:text-base">
				Unlock more renders, AI generations, and features
			</p>
		</div>

		<!-- Monthly/Annual Toggle -->
		<div class="flex flex-col items-start md:items-end gap-2 shrink-0">
			<div
				class="flex items-center p-1 bg-gray-100 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
			>
				<button
					class="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all {showAnnual
						? 'text-gray-500 hover:text-gray-700'
						: 'bg-white text-gray-900 shadow-[2px_2px_0_0_#1f2937] border-2 border-gray-900'}"
					on:click={() => (showAnnual = false)}
				>
					Monthly
				</button>
				<div class="relative">
					<button
						class="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all {showAnnual
							? 'bg-[#ffc480] text-gray-900 shadow-[2px_2px_0_0_#1f2937] border-2 border-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
						on:click={() => (showAnnual = true)}
					>
						Annual
					</button>
					{#if !showAnnual}
						<span
							class="absolute -top-3 -right-3 px-1.5 py-0.5 bg-[#10b981] text-white text-[10px] font-black uppercase tracking-widest rounded border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] rotate-12"
						>
							-20%
						</span>
					{/if}
				</div>
			</div>
			{#if showAnnual}
				<p
					class="text-[10px] font-black text-[#10b981] uppercase tracking-widest bg-[#10b981]/10 px-2 py-0.5 rounded border-2 border-[#10b981]"
				>
					Save 20% with annual billing
				</p>
			{/if}
		</div>
	</div>

	<div class="flex-1 flex flex-col">
		{#if isLoading}
			<div
				class="flex flex-col items-center justify-center py-16 flex-1 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937]"
			>
				<Loader size="10" show={true} />
				<p class="text-gray-900 font-bold mt-4 text-sm uppercase tracking-widest">
					Loading plans...
				</p>
			</div>
		{:else if error}
			<div
				class="flex flex-col items-center justify-center py-12 flex-1 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937]"
			>
				<div
					class="w-12 h-12 bg-[#ff6b6b]/20 rounded-xl border-[3px] border-[#ff6b6b] flex items-center justify-center mb-4"
				>
					<svg class="w-6 h-6 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<p class="text-gray-900 font-black text-lg uppercase tracking-tight mb-2">
					Something went wrong
				</p>
				<p class="text-gray-600 font-medium text-sm">{error}</p>
			</div>
		{:else}
			<!-- Featured Plans (2-tier: Pro and Business) -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
				{#each featuredPlans as plan (plan.name + '-' + showAnnual)}
					{@const isCurrent = isPlanCurrent(plan)}
					{@const isPopular = plan.name === 'Standard'}
					{@const quotas = getQuotas(plan.name)}
					{@const displayPrice =
						showAnnual && plan.price_annual != null ? plan.price_annual : plan.price}
					{@const monthlySavings = plan.price_annual != null ? plan.price - plan.price_annual : 0}

					<div
						class="flex flex-col relative bg-white rounded-2xl border-[3px] {isPopular
							? 'border-[#ff6b6b] shadow-[8px_8px_0_0_#ff6b6b]'
							: 'border-gray-900 shadow-[8px_8px_0_0_#1f2937]'} {isCurrent ? 'opacity-70' : ''}"
					>
						{#if isPopular}
							<div
								class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#ff6b6b] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
							>
								Most Popular
							</div>
						{/if}

						<div class="p-6 sm:p-8 flex-1 flex flex-col">
							<div class="mb-6">
								<h3 class="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
									{plan.name === 'Standard' ? 'Pro' : plan.name}
								</h3>
								<div class="flex items-baseline gap-2 mb-1">
									<span class="text-5xl font-black text-gray-900 tracking-tighter"
										>${displayPrice}</span
									>
									<span class="text-sm font-bold text-gray-500 uppercase">/mo</span>
									{#if showAnnual && monthlySavings > 0}
										<span class="text-lg text-gray-400 font-bold line-through ml-2 decoration-2"
											>${plan.price}</span
										>
									{/if}
								</div>
								{#if showAnnual && monthlySavings > 0}
									<p class="text-sm text-[#10b981] font-black uppercase tracking-widest">
										Save ${monthlySavings * 12}/year
									</p>
								{:else}
									<p class="text-sm text-gray-500 font-bold uppercase tracking-widest">
										{formatRequests(plan.request_per_month)} renders/mo
									</p>
								{/if}
							</div>

							{#if isCurrent}
								<button
									disabled
									class="w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed mb-8"
								>
									Current Plan
								</button>
							{:else}
								<button
									on:click={() => handlePurchase(plan)}
									class="w-full py-4 text-xs font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 transition-all mb-8
										{isPopular
										? 'bg-[#ff6b6b] text-white hover:bg-[#ff5252] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'
										: 'bg-[#ffc480] text-gray-900 hover:bg-[#ffb360] shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]'}"
								>
									Upgrade to {plan.name === 'Standard' ? 'Pro' : plan.name}
								</button>
							{/if}

							<div class="space-y-4 text-sm font-bold flex-1">
								<div
									class="flex items-center justify-between pb-3 border-b-2 border-dashed border-gray-200"
								>
									<span class="text-gray-600">Renders</span>
									<span class="text-gray-900">{formatFeatureValue(quotas.renders)}/mo</span>
								</div>
								<div
									class="flex items-center justify-between pb-3 border-b-2 border-dashed border-gray-200"
								>
									<span class="text-gray-600">Templates</span>
									<span class="text-gray-900">{formatFeatureValue(quotas.templates)}</span>
								</div>
								<div
									class="flex items-center justify-between pb-3 border-b-2 border-dashed border-gray-200"
								>
									<span class="text-gray-600">AI Copilot</span>
									<span class="text-gray-900"
										>{formatFeatureValue(quotas.aiCopilot)}{quotas.aiCopilot !== false &&
										quotas.aiCopilot !== null
											? '/mo'
											: ''}</span
									>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-gray-600">Team Seats</span>
									<span class="text-gray-900">{formatFeatureValue(quotas.teamSeats)}</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>
