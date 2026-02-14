<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { user } from '../../../store/user.store';
	import { getProducts } from '../../../api/product';
	import Loader from '$lib/components/Loader.svelte';
	import { analytics } from '$lib/analytics.js';
	import {
		PLANS,
		PLAN_DISPLAY_NAMES,
		PLAN_PRICING,
		FEATURES,
		PLAN_FEATURES,
		formatLimit,
		OVERAGE_PRICING,
		isOverageEligible,
	} from '../../../config/plan-features.js';
	import OverageSettings from '$lib/components/plg/OverageSettings.svelte';
	import {
		overageState,
		updateOveragePreferences,
		initOverageState,
	} from '../../../store/plg.store';
	import { SubscriptionCard, InvoiceHistory, ConfirmModal } from '$lib/components/billing';
	import {
		billingState,
		billingActions,
		initBilling,
		doPauseSubscription,
		doResumeSubscription,
		doCancelSubscription,
		doReactivateSubscription,
	} from '../../../store/billing.store';
	import { toast } from '../../../store/toast.store';

	let isLoading = true;
	let allPlans = [];
	let error = null;
	let showAllPlans = false;
	let showAnnual = false;

	// Modal states
	let showPauseModal = false;
	let showCancelModal = false;

	$: isLoggedIn = !!$user.email;
	$: currentPlan = $user.currentPlan || 'starter';
	$: isFreeTier = currentPlan.toLowerCase() === 'starter';
	$: canUseOverages = isOverageEligible(currentPlan.toLowerCase());

	// Active tab for billing page
	let activeTab = 'plans';

	// Check URL for tab parameter
	$: tabParam = $page.url.searchParams.get('tab');
	$: if (tabParam === 'billing' && activeTab !== 'billing') {
		activeTab = 'billing';
	}

	// Initialize billing when tab is billing
	$: if (activeTab === 'billing' && !$billingState.loaded && !$billingState.loading) {
		initBilling();
	}

	// Read discount code from URL params (only apply for free tier users)
	$: discountCodeParam = $page.url.searchParams.get('discount');
	$: discountCode = isFreeTier ? discountCodeParam : null;
	$: source = $page.url.searchParams.get('source');

	// Read billing preference from URL (from pricing page)
	$: billingParam = $page.url.searchParams.get('billing');
	$: if (billingParam === 'annual' && !showAnnual) {
		showAnnual = true;
	}

	// Featured plans to highlight (3-tier system)
	// Note: LemonSqueezy returns 'Standard', displayed as 'Pro' on pricing page
	const featuredPlanNames = ['Standard', 'Business'];

	$: featuredPlans = allPlans.filter(p => featuredPlanNames.includes(p.name));
	$: otherPlans = allPlans.filter(p => !featuredPlanNames.includes(p.name) && p.name !== 'Starter');

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
			teamSeats: features[FEATURES.TEAM_SEATS],
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

		// Initialize overage state
		await initOverageState();

		try {
			const response = await getProducts();
			allPlans = (response?.data ?? [])
				.filter((plan) => plan && typeof plan.request_per_month === 'number')
				.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
		} catch (err) {
			console.error('Failed to load plans:', err);
			error = 'Failed to load pricing plans. Please try again.';
		} finally {
			isLoading = false;
		}
	});

	async function handleOverageSettingsChange(event) {
		const { allowOverages, spendingCapCents } = event.detail;
		await updateOveragePreferences({ allowOverages, spendingCapCents });
		analytics.track('overage_settings_changed', {
			allowOverages,
			spendingCapCents,
			plan: currentPlan,
		});
	}

	// Subscription actions
	async function handlePauseConfirm(event) {
		const { resumeDate } = event.detail;
		const result = await doPauseSubscription({
			resumesAt: resumeDate ? new Date(resumeDate).toISOString() : null,
		});

		showPauseModal = false;

		if (result.success) {
			toast.set({ message: 'Subscription paused successfully', type: 'success' });
			analytics.track('subscription_paused', { resumeDate });
		} else {
			toast.set({ message: result.error || 'Failed to pause subscription', type: 'error' });
		}
	}

	async function handleResume() {
		const result = await doResumeSubscription();

		if (result.success) {
			toast.set({ message: 'Subscription resumed successfully', type: 'success' });
			analytics.track('subscription_resumed');
		} else {
			toast.set({ message: result.error || 'Failed to resume subscription', type: 'error' });
		}
	}

	async function handleCancelConfirm() {
		const result = await doCancelSubscription();

		showCancelModal = false;

		if (result.success) {
			toast.set({ message: 'Subscription cancelled. You\'ll have access until your billing period ends.', type: 'success' });
			analytics.track('subscription_cancelled');
		} else {
			toast.set({ message: result.error || 'Failed to cancel subscription', type: 'error' });
		}
	}

	async function handleReactivate() {
		const result = await doReactivateSubscription();

		if (result.success) {
			toast.set({ message: 'Subscription reactivated successfully', type: 'success' });
			analytics.track('subscription_reactivated');
		} else {
			toast.set({ message: result.error || 'Failed to reactivate subscription', type: 'error' });
		}
	}

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
		const purchaseUrl = showAnnual && plan.purchase_url_annual
			? plan.purchase_url_annual
			: plan.purchase_url;

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
	<title>Billing - Pictify.io</title>
</svelte:head>

<div>
	<div>
		<!-- Discount Banner -->
		{#if discountCode && activeTab === 'plans'}
			<div class="mb-6 p-4 bg-[#10b981]/10 border-[3px] border-[#10b981] rounded-xl flex items-center gap-3">
				<div class="w-10 h-10 bg-[#10b981] rounded-lg border-2 border-gray-900 flex items-center justify-center flex-shrink-0">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
					</svg>
				</div>
				<div>
					<p class="font-bold text-gray-900">Discount code applied: <span class="text-[#10b981]">{discountCode}</span></p>
					<p class="text-sm text-gray-600">Your discount will be applied at checkout</p>
				</div>
			</div>
		{/if}

		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3">
				<span class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
				{activeTab === 'plans' ? 'Pricing Plans' : 'Billing Settings'}
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2">
				{activeTab === 'plans' ? 'Upgrade Your' : 'Manage Your'} <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">{activeTab === 'plans' ? 'Plan' : 'Billing'}</span>
			</h1>
			<p class="text-gray-600 font-medium">
				{activeTab === 'plans' ? 'Unlock more renders, AI generations, and features' : 'Configure overage billing and spending limits'}
			</p>
		</div>

		<!-- Tab Navigation -->
		<div class="flex items-center gap-2 mb-6 border-b-2 border-gray-200">
			<button
				class="px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[2px] {activeTab === 'plans' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				on:click={() => activeTab = 'plans'}
			>
				Plans
			</button>
			<button
				class="px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[2px] {activeTab === 'billing' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				on:click={() => activeTab = 'billing'}
			>
				Billing Settings
				{#if canUseOverages && $overageState.allowOverages}
					<span class="ml-1.5 px-1.5 py-0.5 bg-[#10b981] text-white text-[9px] font-bold rounded">ON</span>
				{/if}
			</button>
		</div>

		{#if activeTab === 'plans'}
			<!-- Monthly/Annual Toggle -->
			<div class="mb-6 flex items-center justify-center gap-3">
				<button
					class="px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all {!showAnnual ? 'bg-[#ffc480] border-gray-900 text-gray-900 shadow-[2px_2px_0_0_#1f2937]' : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'}"
					on:click={() => showAnnual = false}
				>
					Monthly
				</button>
				<button
					class="px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all relative {showAnnual ? 'bg-[#ffc480] border-gray-900 text-gray-900 shadow-[2px_2px_0_0_#1f2937]' : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'}"
					on:click={() => showAnnual = true}
				>
					Annual
					<span class="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#10b981] text-white text-[10px] font-bold rounded border border-gray-900">
						-20%
					</span>
				</button>
			</div>

			{#if isLoading}
			<div class="flex flex-col items-center justify-center py-16">
				<Loader size="10" show={true} />
				<p class="text-gray-600 mt-3 text-sm">Loading plans...</p>
			</div>
		{:else if error}
			<div class="flex flex-col items-center justify-center py-12 bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780]">
				<div class="w-12 h-12 bg-[#ff6b6b]/20 rounded-xl border-[3px] border-[#ff6b6b] flex items-center justify-center mb-3">
					<svg class="w-6 h-6 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
					</svg>
				</div>
				<p class="text-gray-900 font-bold text-sm">Something went wrong</p>
				<p class="text-gray-600 text-xs mt-1">{error}</p>
			</div>
		{:else}
			<!-- Featured Plans (2-tier: Pro and Business) -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
				{#each featuredPlans as plan (plan.name + '-' + showAnnual)}
					{@const isCurrent = isPlanCurrent(plan)}
					{@const isPopular = plan.name === 'Standard'}
					{@const quotas = getQuotas(plan.name)}
					{@const displayPrice = showAnnual && plan.price_annual != null ? plan.price_annual : plan.price}
					{@const monthlySavings = plan.price_annual != null ? plan.price - plan.price_annual : 0}

					<div class="relative bg-white rounded-xl border-[3px] {isPopular ? 'border-[#ff6b6b] shadow-[4px_4px_0_0_#ff6b6b80]' : 'border-gray-900 shadow-[4px_4px_0_0_#1f293780]'} {isCurrent ? 'opacity-60' : ''}">

						{#if isPopular}
							<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#ff6b6b] text-white text-[10px] font-bold rounded-full border-2 border-gray-900">
								Most Popular
							</div>
						{/if}

						<div class="p-4">
							<div class="mb-4">
								<h3 class="text-lg font-bold text-gray-900">{plan.name === 'Standard' ? 'Pro' : plan.name}</h3>
								<div class="flex items-baseline gap-2 mt-1">
									{#if showAnnual && monthlySavings > 0}
										<span class="text-base text-gray-400 line-through">${plan.price}</span>
									{/if}
									<span class="text-2xl font-bold text-gray-900">${displayPrice}</span>
									<span class="text-xs text-gray-500">/mo</span>
								</div>
								{#if showAnnual && monthlySavings > 0}
									<p class="text-xs text-[#10b981] font-bold mt-0.5">Save ${monthlySavings * 12}/year</p>
								{:else}
									<p class="text-xs text-gray-500 mt-0.5">{formatRequests(plan.request_per_month)} renders/mo</p>
								{/if}
							</div>

							{#if isCurrent}
								<button disabled class="w-full py-2 px-3 bg-gray-200 text-gray-500 text-sm font-bold rounded-lg border-2 border-gray-300 cursor-not-allowed mb-3">
									Current Plan
								</button>
							{:else}
								<button
									on:click={() => handlePurchase(plan)}
									class="w-full py-2 px-3 text-sm font-bold rounded-lg border-[3px] border-gray-900 transition-all mb-3
										{isPopular
											? 'bg-[#ff6b6b] text-white shadow-[2px_2px_0_0_#1f293780] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
											: 'bg-[#ffc480] text-gray-900 shadow-[2px_2px_0_0_#1f293780] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'}">
									Upgrade to {plan.name === 'Standard' ? 'Pro' : plan.name}
								</button>
							{/if}

							<div class="space-y-1.5 text-xs">
								<div class="flex items-center justify-between py-1 border-b border-gray-100">
									<span class="text-gray-600">Renders</span>
									<span class="font-bold text-gray-900">{formatFeatureValue(quotas.renders)}/mo</span>
								</div>
								<div class="flex items-center justify-between py-1 border-b border-gray-100">
									<span class="text-gray-600">Templates</span>
									<span class="font-bold text-gray-900">{formatFeatureValue(quotas.templates)}</span>
								</div>
								<div class="flex items-center justify-between py-1 border-b border-gray-100">
									<span class="text-gray-600">AI Copilot</span>
									<span class="font-bold text-gray-900">{formatFeatureValue(quotas.aiCopilot)}{quotas.aiCopilot !== false && quotas.aiCopilot !== null ? '/mo' : ''}</span>
								</div>
								<div class="flex items-center justify-between py-1">
									<span class="text-gray-600">Team Seats</span>
									<span class="font-bold text-gray-900">{formatFeatureValue(quotas.teamSeats)}</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Other Plans Toggle -->
			{#if otherPlans.length > 0}
				<div class="text-center mb-4">
					<button 
						on:click={() => showAllPlans = !showAllPlans}
						class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-white rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f293780] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>
						{showAllPlans ? 'Hide' : 'View'} {otherPlans.length} more plans
						<svg class="w-3 h-3 transition-transform {showAllPlans ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
						</svg>
					</button>
				</div>

				{#if showAllPlans}
					<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] overflow-hidden mb-4">
						<table class="w-full text-xs">
							<thead>
								<tr class="bg-[#ffc480]/30 border-b-[3px] border-gray-900">
									<th class="px-4 py-2 text-left font-bold text-gray-900">Plan</th>
									<th class="px-4 py-2 text-left font-bold text-gray-900">Price</th>
									<th class="px-4 py-2 text-left font-bold text-gray-900">Renders</th>
									<th class="px-4 py-2 text-left font-bold text-gray-900">AI Copilot</th>
									<th class="px-4 py-2 text-right font-bold text-gray-900"></th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								{#each otherPlans as plan}
									{@const isCurrent = isPlanCurrent(plan)}
									{@const quotas = getQuotas(plan.name)}
									<tr class="hover:bg-gray-50 {isCurrent ? 'bg-gray-100' : ''}">
										<td class="px-4 py-2 font-bold text-gray-900">
											{plan.name}
											{#if isCurrent}
												<span class="ml-1 text-[10px] font-bold text-[#ff6b6b]">Current</span>
											{/if}
										</td>
										<td class="px-4 py-2 text-gray-900">{plan.price_formatted?.replace('/month', '') || '$' + plan.price}/mo</td>
										<td class="px-4 py-2 text-gray-700">{formatFeatureValue(quotas.renders)}</td>
										<td class="px-4 py-2 text-gray-700">{formatFeatureValue(quotas.aiCopilot)}</td>
										<td class="px-4 py-2 text-right">
											{#if !isCurrent}
												<button
													on:click={() => handlePurchase(plan)}
													class="px-3 py-1 font-bold text-gray-900 bg-[#ffc480] rounded border-2 border-gray-900 hover:bg-[#ffb347] transition-colors"
												>
													Select
												</button>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{/if}

			<!-- Trust Signals -->
			<div class="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
				<span class="flex items-center gap-1">
					<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
					Cancel anytime
				</span>
				<span class="flex items-center gap-1">
					<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
					Secure payment
				</span>
				<span class="flex items-center gap-1">
					<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
					</svg>
					Instant activation
				</span>
				<span class="text-gray-400">|</span>
				<a href="mailto:support@pictify.io" class="font-medium text-[#ff6b6b] hover:underline">Need custom plan?</a>
			</div>
			{/if}
		{:else}
			<!-- Billing Settings Tab -->
			<div class="max-w-2xl mx-auto space-y-6">
				{#if $billingState.loading}
					<div class="flex flex-col items-center justify-center py-16">
						<Loader size="10" show={true} />
						<p class="text-gray-600 mt-3 text-sm">Loading billing information...</p>
					</div>
				{:else if $billingState.error}
					<div class="flex flex-col items-center justify-center py-12 bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780]">
						<div class="w-12 h-12 bg-[#ff6b6b]/20 rounded-xl border-[3px] border-[#ff6b6b] flex items-center justify-center mb-3">
							<svg class="w-6 h-6 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							</svg>
						</div>
						<p class="text-gray-900 font-bold text-sm">Failed to load billing</p>
						<p class="text-gray-600 text-xs mt-1">{$billingState.error}</p>
						<button
							on:click={() => initBilling()}
							class="mt-4 px-4 py-2 text-sm font-bold text-gray-900 bg-[#ffc480] rounded-lg border-2 border-gray-900"
						>
							Retry
						</button>
					</div>
				{:else}
					<!-- Subscription Card -->
					<SubscriptionCard
						subscription={$billingState.subscription}
						customerPortalUrl={$billingState.customerPortalUrl}
						pausing={$billingActions.pausing}
						resuming={$billingActions.resuming}
						cancelling={$billingActions.cancelling}
						reactivating={$billingActions.reactivating}
						on:pause={() => showPauseModal = true}
						on:resume={handleResume}
						on:cancel={() => showCancelModal = true}
						on:reactivate={handleReactivate}
					/>

					<!-- Invoice History -->
					<InvoiceHistory
						invoices={$billingState.invoices}
						loading={$billingState.loading}
					/>

					<!-- Overage Settings Section -->
					{#if $billingState.subscription}
						<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] overflow-hidden">
							<div class="px-5 py-4 border-b-2 border-gray-200">
								<h2 class="text-lg font-black text-gray-900 flex items-center gap-2">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
									</svg>
									Overage Billing
								</h2>
								<p class="text-sm text-gray-600">Configure pay-per-render when you exceed your plan limits</p>
							</div>
							<div class="p-5">
								{#if canUseOverages}
									<OverageSettings on:change={handleOverageSettingsChange} />
								{:else}
									<div class="text-center py-4">
										<p class="text-sm text-gray-600">
											Upgrade to Pro or Business to enable overage billing.
										</p>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Pause Modal -->
		<ConfirmModal
			open={showPauseModal}
			title="Pause Subscription"
			description="Your subscription will be paused and you won't be charged until you resume. Your access continues until the current billing period ends."
			confirmText="Pause Subscription"
			cancelText="Keep Active"
			variant="warning"
			loading={$billingActions.pausing}
			showResumeDate={true}
			on:confirm={handlePauseConfirm}
			on:cancel={() => showPauseModal = false}
		/>

		<!-- Cancel Modal -->
		<ConfirmModal
			open={showCancelModal}
			title="Cancel Subscription"
			description="Your subscription will be cancelled. You'll continue to have access until the end of your current billing period, then your account will revert to the free tier."
			confirmText="Cancel Subscription"
			cancelText="Keep Subscription"
			variant="danger"
			loading={$billingActions.cancelling}
			on:confirm={handleCancelConfirm}
			on:cancel={() => showCancelModal = false}
		/>
	</div>
</div>
