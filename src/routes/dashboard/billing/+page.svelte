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
	// Get plan from billing API (respects team context) with fallback to user store
	$: currentPlan = $billingState.subscription?.plan || $user.currentPlan || 'starter';
	$: isFreeTier = currentPlan.toLowerCase() === 'starter';
	$: canUseOverages = isOverageEligible(currentPlan.toLowerCase());

	// Initialize billing and overage state
	onMount(async () => {
		// Track pricing page view from dashboard
		analytics.trackPricingViewed({ source: 'dashboard_upgrade' });

		// Initialize overage state
		await initOverageState();

		// Always refresh billing state when viewing billing page to get latest data
		// This bypasses the 5-minute server cache to ensure plan changes are reflected
		initBilling({ refresh: true });

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

<section class="min-h-full">
	<!-- Discount Banner -->
	{#if discountCode}
		<div class="mb-8 max-w-2xl p-4 bg-[#10b981]/10 border-[3px] border-[#10b981] rounded-2xl flex items-center gap-4 shadow-[4px_4px_0_0_#10b981]">
			<div class="w-12 h-12 bg-[#10b981] rounded-xl border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]">
				<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
				</svg>
			</div>
			<div>
				<p class="font-black text-gray-900 text-lg uppercase tracking-tight">Code Applied: <span class="text-[#10b981]">{discountCode}</span></p>
				<p class="text-sm font-bold text-gray-600">Your discount will be applied at checkout automatically.</p>
			</div>
		</div>
	{/if}

	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
		<div>
			<div class="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3">
				<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
				Account
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				Plans & <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Billing</span>
			</h1>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-right">
				<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Current Plan</div>
				<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">{currentPlan || 'Starter'}</div>
			</div>
		</div>
	</div>

	<!-- Layout Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
		
		<!-- Left Column: Subscription & History -->
		<div class="lg:col-span-8 space-y-8">
			<!-- Current Subscription -->
			<section>
				{#if $billingState.loading && !$billingState.loaded}
					<div class="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937]">
						<Loader size="10" show={true} />
						<p class="text-gray-900 font-bold mt-4 text-sm uppercase tracking-widest">Loading details...</p>
					</div>
				{:else if $billingState.error}
					<div class="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937]">
						<div class="w-12 h-12 bg-[#ff6b6b]/20 rounded-xl border-[3px] border-[#ff6b6b] flex items-center justify-center mb-4">
							<svg class="w-6 h-6 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							</svg>
						</div>
						<p class="text-gray-900 font-black text-lg uppercase tracking-tight mb-2">Failed to load</p>
						<p class="text-gray-600 font-medium text-sm mb-6">{$billingState.error}</p>
						<button
							on:click={() => initBilling()}
							class="px-6 py-2.5 text-sm font-black text-gray-900 bg-[#ffc480] uppercase tracking-widest rounded-xl border-[3px] border-gray-900 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0_0_#1f2937] transition-all"
						>
							Retry
						</button>
					</div>
				{:else}
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
				{/if}
			</section>

			<!-- Invoice History -->
			<section>
				<InvoiceHistory
					invoices={$billingState.invoices}
					loading={$billingState.loading && !$billingState.invoices.length}
				/>
			</section>
		</div>

		<!-- Right Column: Settings & Upgrade -->
		<div class="lg:col-span-4 space-y-8 sticky top-8">
			
			<!-- Overage Settings -->
			{#if canUseOverages && $billingState.subscription}
				<OverageSettings
					plan={currentPlan}
					allowOverages={$overageState.allowOverages}
					spendingCapCents={$overageState.spendingCapCents}
					currentCycleOverages={$overageState.currentCycleOverages}
					currentCycleOverageCostCents={$overageState.currentCycleOverageCostCents}
					loading={!$overageState.loaded}
					on:change={handleOverageSettingsChange}
				/>
			{/if}

			<!-- Upgrade Side Card (if not highest tier) -->
			{#if $billingState.loaded && currentPlan !== 'business'}
				<div class="bg-gray-900 rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#ffc480] overflow-hidden flex flex-col">
					<!-- Header -->
					<div class="bg-gray-800 border-b-[3px] border-gray-900 p-4">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-lg bg-[#ffc480] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#000]">
								<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
								</svg>
							</div>
							<div>
								<h2 class="text-xs font-black text-white uppercase tracking-widest">Upgrade Plan</h2>
								<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unlock more power</p>
							</div>
						</div>
					</div>

					<!-- Content -->
					<div class="p-6 flex-1 flex flex-col">
						<p class="text-gray-300 text-sm font-medium mb-6 leading-relaxed">
							Need higher limits, team seats, or priority support? Upgrade to a plan that fits your scale.
						</p>
						
						<a
							href="/dashboard/upgrade"
							class="w-full py-3 px-4 rounded-lg font-black text-xs uppercase tracking-widest transition-all bg-[#ffc480] text-gray-900 hover:bg-[#ffb360] shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] text-center mt-auto"
						>
							View Plans
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Modals -->
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
</section>
