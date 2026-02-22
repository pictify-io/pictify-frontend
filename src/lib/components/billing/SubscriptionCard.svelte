<script>
	import { createEventDispatcher } from 'svelte';
	import { formatCurrency, getStatusLabel, getStatusColor } from '../../../store/billing.store';
	import { getPortalUrl } from '../../../api/billing';

	export let subscription = null;
	export let customerPortalUrl = null;
	export let pausing = false;
	export let resuming = false;
	export let cancelling = false;
	export let reactivating = false;

	const dispatch = createEventDispatcher();

	let loadingPortalUrl = false;

	// Derived states
	$: hasLemonSqueezySubscription = subscription?.hasSubscription === true;
	$: currentPlan = subscription?.plan || 'starter';
	$: isPaidPlanWithoutLS = !hasLemonSqueezySubscription && currentPlan !== 'starter';
	$: isFreePlan = !hasLemonSqueezySubscription && currentPlan === 'starter';

	$: isActive = subscription?.status === 'active';
	$: isPaused = subscription?.status === 'paused';
	$: isCancelled = subscription?.status === 'cancelled' || subscription?.endsAt !== null;
	$: isPayPal = subscription?.paymentProcessor === 'paypal';
	$: canPause = isActive && !isPayPal;
	$: canResume = isPaused;
	$: canCancel = ['active', 'paused'].includes(subscription?.status) && !subscription?.endsAt;
	$: canReactivate = subscription?.endsAt !== null && subscription?.status !== 'expired';

	// Format plan name for display
	// Note: 'standard' is displayed as 'Pro' (marketing name)
	function formatPlanName(plan) {
		const planNames = {
			starter: 'Starter',
			free: 'Starter',
			basic: 'Basic',
			standard: 'Pro',     // LemonSqueezy 'Standard' = marketing 'Pro'
			pro: 'Pro',          // Alias
			professional: 'Professional',
			business: 'Business',
			enterprise: 'Enterprise',
			unlimited: 'Unlimited'
		};
		return planNames[plan?.toLowerCase()] || plan?.charAt(0).toUpperCase() + plan?.slice(1) || 'Unknown';
	}

	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	}

	function handlePause() {
		dispatch('pause');
	}

	function handleResume() {
		dispatch('resume');
	}

	function handleCancel() {
		dispatch('cancel');
	}

	function handleReactivate() {
		dispatch('reactivate');
	}

	/**
	 * Fetch fresh signed portal URL and open it
	 * This bypasses LemonSqueezy auth - users go directly to their dashboard
	 */
	async function openPortal() {
		if (loadingPortalUrl) return;

		loadingPortalUrl = true;
		try {
			const { customerPortalUrl: freshUrl } = await getPortalUrl();
			if (freshUrl) {
				window.open(freshUrl, '_blank');
			} else if (customerPortalUrl) {
				// Fallback to cached URL
				window.open(customerPortalUrl, '_blank');
			}
		} catch (error) {
			console.error('Failed to get portal URL:', error);
			// Fallback to cached URL on error
			if (customerPortalUrl) {
				window.open(customerPortalUrl, '_blank');
			}
		} finally {
			loadingPortalUrl = false;
		}
	}

	/**
	 * Fetch fresh signed URL and open payment method update page
	 */
	async function updatePaymentMethod() {
		if (loadingPortalUrl) return;

		loadingPortalUrl = true;
		try {
			const { updatePaymentMethodUrl, customerPortalUrl: freshUrl } = await getPortalUrl();
			// Prefer direct update URL, fall back to portal
			const url = updatePaymentMethodUrl || freshUrl || customerPortalUrl;
			if (url) {
				window.open(url, '_blank');
			}
		} catch (error) {
			console.error('Failed to get portal URL:', error);
			// Fallback to cached URLs
			const url = subscription?.updatePaymentMethodUrl || customerPortalUrl;
			if (url) {
				window.open(url, '_blank');
			}
		} finally {
			loadingPortalUrl = false;
		}
	}
</script>

<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden relative group">
	<!-- Header -->
	<div class="bg-gray-100 border-b-[3px] border-gray-900 p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-2 h-2 rounded-full bg-gray-900 animate-pulse"></div>
				<h2 class="text-xs font-black text-gray-900 uppercase tracking-widest">
					{#if hasLemonSqueezySubscription}
						Manage Subscription
					{:else if isPaidPlanWithoutLS}
						Current Plan
					{:else}
						Current Tier
					{/if}
				</h2>
			</div>
			
			{#if hasLemonSqueezySubscription}
				<div class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border-2 border-gray-900 {getStatusColor(subscription.status)}">
					{getStatusLabel(subscription.status)}
				</div>
			{:else if isPaidPlanWithoutLS}
				<div class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border-2 border-gray-900 bg-[#10b981] text-gray-900">
					Active
				</div>
			{/if}
		</div>
	</div>

	{#if hasLemonSqueezySubscription}
		<!-- Plan Details -->
		<div class="p-6 space-y-6">
			<!-- Plan Name & Price -->
			<div class="flex items-start justify-between">
				<div>
					<p class="text-3xl font-black text-gray-900 uppercase tracking-tight">{subscription.productName || 'Pro'}</p>
					<p class="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{subscription.variantName || 'Monthly'}</p>
				</div>
				{#if subscription.price}
					<div class="text-right">
						<p class="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(subscription.price)}</p>
						<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/ {subscription.interval || 'month'}</p>
					</div>
				{/if}
			</div>

			<!-- Renewal / End Date -->
			<div class="p-4 bg-white rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_0_#e5e7eb]">
				{#if subscription.endsAt}
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-red-100 border-2 border-red-200 flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
							</svg>
						</div>
						<div>
							<p class="text-xs font-black text-gray-900 uppercase tracking-wide">Cancellation scheduled</p>
							<p class="text-xs font-medium text-gray-500">Access until {formatDate(subscription.endsAt)}</p>
						</div>
					</div>
				{:else if subscription.renewsAt}
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-[#10b981] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]">
							<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
							</svg>
						</div>
						<div>
							<p class="text-xs font-black text-gray-900 uppercase tracking-wide">Next renewal</p>
							<p class="text-xs font-medium text-gray-500">{formatDate(subscription.renewsAt)}</p>
						</div>
					</div>
				{/if}

				{#if isPaused && subscription.resumesAt}
					<div class="flex items-center gap-3 mt-3 pt-3 border-t-2 border-dashed border-gray-200">
						<div class="w-8 h-8 rounded-lg bg-[#f59e0b] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
						<div>
							<p class="text-xs font-black text-gray-900 uppercase tracking-wide">Subscription Paused</p>
							<p class="text-xs font-medium text-gray-500">Resumes on {formatDate(subscription.resumesAt)}</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Payment Method -->
			{#if subscription.cardBrand || subscription.paymentProcessor}
				<div class="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_0_#e5e7eb]">
					<div class="flex items-center gap-3">
						{#if subscription.cardBrand}
							<div class="w-10 h-7 bg-gray-100 rounded border-2 border-gray-900 flex items-center justify-center">
								{#if subscription.cardBrand === 'visa'}
									<span class="text-[10px] font-black text-blue-800 uppercase">VISA</span>
								{:else if subscription.cardBrand === 'mastercard'}
									<span class="text-[10px] font-black text-orange-800 uppercase">MC</span>
								{:else if subscription.cardBrand === 'amex'}
									<span class="text-[10px] font-black text-blue-600 uppercase">AMEX</span>
								{:else}
									<span class="text-[10px] font-black text-gray-600 uppercase">{subscription.cardBrand.slice(0, 3)}</span>
								{/if}
							</div>
							<div>
								<div class="flex items-center gap-2">
									<p class="text-xs font-black text-gray-900 uppercase">Card ending in {subscription.cardLastFour}</p>
								</div>
								<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{subscription.cardBrand}</p>
							</div>
						{:else if subscription.paymentProcessor === 'paypal'}
							<div class="w-10 h-7 bg-[#003087] rounded border-2 border-gray-900 flex items-center justify-center">
								<span class="text-[10px] font-black text-white uppercase">PP</span>
							</div>
							<div>
								<p class="text-xs font-black text-gray-900 uppercase">PayPal</p>
								<p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Connected</p>
							</div>
						{/if}
					</div>
					<button
						on:click={updatePaymentMethod}
						disabled={loadingPortalUrl}
						class="text-[10px] font-black text-gray-900 hover:text-[#ff6b6b] uppercase tracking-wider hover:underline decoration-2 underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-wait"
					>
						{#if loadingPortalUrl}
							<span class="inline-flex items-center gap-1">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Opening...
							</span>
						{:else}
							Update
						{/if}
					</button>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex flex-wrap gap-3 pt-2">
				{#if canPause}
					<button
						on:click={handlePause}
						disabled={pausing}
						class="px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-900 bg-white rounded-lg border-2 border-gray-900 hover:bg-gray-50 shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
					>
						{#if pausing}
							<span class="inline-flex items-center gap-2">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Pausing...
							</span>
						{:else}
							Pause
						{/if}
					</button>
				{/if}

				{#if canResume}
					<button
						on:click={handleResume}
						disabled={resuming}
						class="px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-900 bg-[#10b981] rounded-lg border-2 border-gray-900 hover:bg-[#059669] shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
					>
						{#if resuming}
							<span class="inline-flex items-center gap-2">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Resuming...
							</span>
						{:else}
							Resume
						{/if}
					</button>
				{/if}

				{#if canReactivate}
					<button
						on:click={handleReactivate}
						disabled={reactivating}
						class="px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-900 bg-[#10b981] rounded-lg border-2 border-gray-900 hover:bg-[#059669] shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
					>
						{#if reactivating}
							<span class="inline-flex items-center gap-2">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Reactivating...
							</span>
						{:else}
							Reactivate
						{/if}
					</button>
				{/if}

				{#if canCancel}
					<button
						on:click={handleCancel}
						disabled={cancelling}
						class="px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-900 bg-white rounded-lg border-2 border-gray-900 hover:bg-red-50 hover:text-red-900 hover:border-red-900 shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
					>
						{#if cancelling}
							<span class="inline-flex items-center gap-2">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Cancelling...
							</span>
						{:else}
							Cancel
						{/if}
					</button>
				{/if}

				{#if customerPortalUrl || hasLemonSqueezySubscription}
					<button
						on:click={openPortal}
						disabled={loadingPortalUrl}
						class="ml-auto px-4 py-2 text-[10px] sm:text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors flex items-center gap-1 group disabled:opacity-50 disabled:cursor-wait"
					>
						{#if loadingPortalUrl}
							<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						{:else}
							Manage on LemonSqueezy
							<svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
						{/if}
					</button>
				{/if}
			</div>

			{#if isPayPal && !canPause}
				<p class="text-[10px] font-bold text-gray-400 italic text-center">
					* Pausing is not available for PayPal subscriptions.
				</p>
			{/if}
		</div>
	{:else if isPaidPlanWithoutLS}
		<!-- Paid Plan without LemonSqueezy Subscription -->
		<div class="p-6 space-y-6">
			<!-- Plan Name -->
			<div class="flex items-start justify-between">
				<div>
					<p class="text-3xl font-black text-gray-900 uppercase tracking-tight">{formatPlanName(currentPlan)}</p>
					<p class="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Your current plan</p>
				</div>
				<div class="w-12 h-12 bg-[#10b981] rounded-xl border-2 border-gray-900 flex items-center justify-center shadow-[3px_3px_0_0_#1f2937]">
					<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
					</svg>
				</div>
			</div>

			<!-- Plan Info -->
			<div class="p-4 bg-white rounded-xl border-2 border-gray-900 shadow-[4px_4px_0_0_#e5e7eb]">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-lg bg-blue-100 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
						<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<div>
						<p class="text-xs font-black text-gray-900 uppercase tracking-wide">Externally Managed</p>
						<p class="text-xs font-medium text-gray-500">Subscription set up outside billing portal.</p>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex flex-wrap gap-2 pt-2">
				<a
					href="/dashboard/upgrade"
					class="w-full text-center px-4 py-3 text-xs font-black text-gray-900 bg-white rounded-lg border-2 border-gray-900 hover:bg-gray-50 shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] transition-all uppercase tracking-widest"
				>
					View all plans
				</a>
			</div>
		</div>
	{:else}
		<!-- Free Plan -->
		<div class="p-8 text-center">
			<div class="w-16 h-16 bg-gray-100 rounded-2xl border-[3px] border-gray-900 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0_0_#1f2937]">
				<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
			</div>
			<h3 class="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Starter Plan</h3>
			<p class="text-sm font-medium text-gray-600 mb-6 max-w-xs mx-auto">
				You're currently on the starter tier with limited renders per month.
			</p>
			<a
				href="/dashboard/upgrade"
				class="inline-flex items-center gap-2 px-6 py-3 bg-[#ffc480] text-gray-900 text-xs font-black uppercase tracking-widest rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
			>
				Upgrade to Pro
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
				</svg>
			</a>
		</div>
	{/if}
</div>
