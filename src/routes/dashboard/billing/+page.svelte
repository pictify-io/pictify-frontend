<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user } from '../../../store/user.store';
	import Loader from '$lib/components/Loader.svelte';
	import { analytics } from '$lib/analytics.js';
	import { isOverageEligible } from '../../../config/plan-features.js';
	import OverageSettings from '$lib/components/plg/OverageSettings.svelte';
	import {
		overageState,
		updateOveragePreferences,
		initOverageState
	} from '../../../store/plg.store';
	import {
		SubscriptionCard,
		InvoiceHistory,
		OverageInvoices,
		ConfirmModal
	} from '$lib/components/billing';
	import { getOverageInvoices } from '../../../api/billing';
	import {
		billingState,
		billingActions,
		initBilling,
		doPauseSubscription,
		doResumeSubscription,
		doCancelSubscription,
		doReactivateSubscription
	} from '../../../store/billing.store';
	import { toast } from '../../../store/toast.store';

	let overageInvoices = [];
	let overageInvoicesLoading = false;

	// Modal states
	let showPauseModal = false;
	let showCancelModal = false;

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

		// Load overage invoices
		overageInvoicesLoading = true;
		getOverageInvoices()
			.then((res) => {
				overageInvoices = res.invoices || [];
			})
			.finally(() => {
				overageInvoicesLoading = false;
			});

		// Always refresh billing state when viewing billing page to get latest data
		// This bypasses the 5-minute server cache to ensure plan changes are reflected
		initBilling({ refresh: true });
	});

	// Read discount code from URL params (only apply for free tier users)
	$: discountCodeParam = $page.url.searchParams.get('discount');
	$: discountCode = isFreeTier ? discountCodeParam : null;

	async function handleOverageSettingsChange(event) {
		const { allowOverages, spendingCapCents } = event.detail;
		await updateOveragePreferences({ allowOverages, spendingCapCents });
		analytics.track('overage_settings_changed', {
			allowOverages,
			spendingCapCents,
			plan: currentPlan
		});
	}

	// Subscription actions
	async function handlePauseConfirm(event) {
		const { resumeDate } = event.detail;
		const result = await doPauseSubscription({
			resumesAt: resumeDate ? new Date(resumeDate).toISOString() : null
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
			toast.set({
				message: "Subscription cancelled. You'll have access until your billing period ends.",
				type: 'success'
			});
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

</script>

<svelte:head>
	<title>Billing - Pictify.io</title>
</svelte:head>

<section class="min-h-full">
	<!-- Discount Banner -->
	{#if discountCode}
		<div
			class="mb-8 max-w-2xl p-4 bg-brand-success/10 border-[3px] border-brand-success rounded-2xl flex items-center gap-4 shadow-[4px_4px_0_0_#10b981]"
		>
			<div
				class="w-12 h-12 bg-brand-success rounded-xl border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-brutal-sm"
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
					Code Applied: <span class="text-brand-success">{discountCode}</span>
				</p>
				<p class="text-sm font-bold text-gray-600">
					Your discount will be applied at checkout automatically.
				</p>
			</div>
		</div>
	{/if}

	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
		<div>
			<div
				class="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded mb-2 sm:mb-3"
			>
				<span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-accent rounded-full" />
				Account
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">
				Plans & <span class="text-gray-900">Billing</span>
			</h1>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-right">
				<div class="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
					Current Plan
				</div>
				<div class="text-lg sm:text-xl font-black text-gray-900 uppercase">
					{currentPlan || 'Starter'}
				</div>
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
					<div
						class="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl"
					>
						<Loader size="10" show={true} />
						<p class="text-gray-900 font-bold mt-4 text-sm uppercase tracking-widest">
							Loading details...
						</p>
					</div>
				{:else if $billingState.error}
					<div
						class="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl"
					>
						<div
							class="w-12 h-12 bg-brand-danger/20 rounded-xl border-[3px] border-brand-danger flex items-center justify-center mb-4"
						>
							<svg
								class="w-6 h-6 text-brand-danger"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<p class="text-gray-900 font-black text-lg uppercase tracking-tight mb-2">
							Failed to load
						</p>
						<p class="text-gray-600 font-medium text-sm mb-6">{$billingState.error}</p>
						<button
							on:click={() => initBilling()}
							class="px-6 py-2.5 text-sm font-black text-gray-900 bg-brand-accent uppercase tracking-widest rounded-xl border-[3px] border-gray-900 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-brutal-lg transition-all"
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
						on:pause={() => (showPauseModal = true)}
						on:resume={handleResume}
						on:cancel={() => (showCancelModal = true)}
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

			<!-- Overage Invoices -->
			<section>
				<OverageInvoices invoices={overageInvoices} loading={overageInvoicesLoading} />
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
				<div
					class="bg-gray-900 rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#ffc480] overflow-hidden flex flex-col"
				>
					<!-- Header -->
					<div class="bg-gray-800 border-b-[3px] border-gray-900 p-4">
						<div class="flex items-center gap-3">
							<div
								class="w-8 h-8 rounded-lg bg-brand-accent border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-brutal-sm"
							>
								<svg
									class="w-4 h-4 text-gray-900"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2.5"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-xs font-black text-white uppercase tracking-widest">
									Upgrade Plan
								</h2>
								<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
									Unlock more power
								</p>
							</div>
						</div>
					</div>

					<!-- Content -->
					<div class="p-6 flex-1 flex flex-col">
						<p class="text-gray-300 text-sm font-medium mb-6 leading-relaxed">
							Need higher limits, team seats, or priority support? Upgrade to a plan that fits your
							scale.
						</p>

						<a
							href="/dashboard/upgrade"
							class="w-full py-3 px-4 rounded-lg font-black text-xs uppercase tracking-widest transition-all bg-brand-accent text-gray-900 hover:bg-[#ffb360] shadow-brutal-lg hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm text-center mt-auto"
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
		on:cancel={() => (showPauseModal = false)}
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
		on:cancel={() => (showCancelModal = false)}
	/>
</section>
