<script>
	import { createEventDispatcher } from 'svelte';
	import { formatCurrency, getStatusLabel, getStatusColor } from '../../../store/billing.store';

	export let subscription = null;
	export let customerPortalUrl = null;
	export let pausing = false;
	export let resuming = false;
	export let cancelling = false;
	export let reactivating = false;

	const dispatch = createEventDispatcher();

	// Derived states
	$: isActive = subscription?.status === 'active';
	$: isPaused = subscription?.status === 'paused';
	$: isCancelled = subscription?.status === 'cancelled' || subscription?.endsAt !== null;
	$: isPayPal = subscription?.paymentProcessor === 'paypal';
	$: canPause = isActive && !isPayPal;
	$: canResume = isPaused;
	$: canCancel = ['active', 'paused'].includes(subscription?.status) && !subscription?.endsAt;
	$: canReactivate = subscription?.endsAt !== null && subscription?.status !== 'expired';

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

	function openPortal() {
		if (customerPortalUrl) {
			window.open(customerPortalUrl, '_blank');
		}
	}
</script>

<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] overflow-hidden">
	<!-- Header -->
	<div class="px-5 py-4 bg-gradient-to-r from-[#ffc480]/20 to-transparent border-b-2 border-gray-200">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-black text-gray-900">Subscription</h2>
				<p class="text-sm text-gray-600">
					{#if subscription}
						Manage your {subscription.productName || 'Pro'} plan
					{:else}
						You're on the free plan
					{/if}
				</p>
			</div>
			{#if subscription}
				<span class="px-3 py-1 text-xs font-bold rounded-full {getStatusColor(subscription.status)}">
					{getStatusLabel(subscription.status)}
				</span>
			{/if}
		</div>
	</div>

	{#if subscription}
		<!-- Plan Details -->
		<div class="p-5 space-y-4">
			<!-- Plan Name & Price -->
			<div class="flex items-start justify-between">
				<div>
					<p class="text-2xl font-black text-gray-900">{subscription.productName || 'Pro'}</p>
					<p class="text-sm text-gray-500">{subscription.variantName || 'Monthly'}</p>
				</div>
				{#if subscription.price}
					<div class="text-right">
						<p class="text-xl font-bold text-gray-900">{formatCurrency(subscription.price)}</p>
						<p class="text-xs text-gray-500">per {subscription.interval || 'month'}</p>
					</div>
				{/if}
			</div>

			<!-- Renewal / End Date -->
			<div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
				{#if subscription.endsAt}
					<div class="flex items-center gap-2">
						<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
						</svg>
						<div>
							<p class="text-sm font-bold text-red-600">Cancellation scheduled</p>
							<p class="text-xs text-gray-600">Access until {formatDate(subscription.endsAt)}</p>
						</div>
					</div>
				{:else if subscription.renewsAt}
					<div class="flex items-center gap-2">
						<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
						</svg>
						<div>
							<p class="text-sm font-bold text-gray-900">Next renewal</p>
							<p class="text-xs text-gray-600">{formatDate(subscription.renewsAt)}</p>
						</div>
					</div>
				{/if}

				{#if isPaused && subscription.resumesAt}
					<div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
						<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						<div>
							<p class="text-sm font-bold text-yellow-600">Paused</p>
							<p class="text-xs text-gray-600">Resumes on {formatDate(subscription.resumesAt)}</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Payment Method -->
			{#if subscription.cardBrand || subscription.paymentProcessor}
				<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
					<div class="flex items-center gap-3">
						{#if subscription.cardBrand}
							<div class="w-10 h-6 bg-white rounded border border-gray-300 flex items-center justify-center">
								{#if subscription.cardBrand === 'visa'}
									<span class="text-xs font-bold text-blue-600">VISA</span>
								{:else if subscription.cardBrand === 'mastercard'}
									<span class="text-xs font-bold text-orange-600">MC</span>
								{:else if subscription.cardBrand === 'amex'}
									<span class="text-xs font-bold text-blue-500">AMEX</span>
								{:else}
									<span class="text-xs font-bold text-gray-600">{subscription.cardBrand.toUpperCase()}</span>
								{/if}
							</div>
							<div>
								<p class="text-sm font-bold text-gray-900">**** {subscription.cardLastFour}</p>
								<p class="text-xs text-gray-500">{subscription.cardBrand}</p>
							</div>
						{:else if subscription.paymentProcessor === 'paypal'}
							<div class="w-10 h-6 bg-[#003087] rounded flex items-center justify-center">
								<span class="text-xs font-bold text-white">PP</span>
							</div>
							<div>
								<p class="text-sm font-bold text-gray-900">PayPal</p>
								<p class="text-xs text-gray-500">Connected account</p>
							</div>
						{/if}
					</div>
					<button
						on:click={openPortal}
						class="text-xs font-bold text-[#ff6b6b] hover:underline"
					>
						Update
					</button>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex flex-wrap gap-2 pt-2">
				{#if canPause}
					<button
						on:click={handlePause}
						disabled={pausing}
						class="px-3 py-2 text-xs font-bold text-gray-700 bg-white rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all disabled:opacity-50"
					>
						{#if pausing}
							<span class="inline-flex items-center gap-1">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Pausing...
							</span>
						{:else}
							Pause subscription
						{/if}
					</button>
				{/if}

				{#if canResume}
					<button
						on:click={handleResume}
						disabled={resuming}
						class="px-3 py-2 text-xs font-bold text-white bg-green-600 rounded-lg border-2 border-green-700 hover:bg-green-700 transition-all disabled:opacity-50"
					>
						{#if resuming}
							<span class="inline-flex items-center gap-1">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Resuming...
							</span>
						{:else}
							Resume subscription
						{/if}
					</button>
				{/if}

				{#if canReactivate}
					<button
						on:click={handleReactivate}
						disabled={reactivating}
						class="px-3 py-2 text-xs font-bold text-white bg-green-600 rounded-lg border-2 border-green-700 hover:bg-green-700 transition-all disabled:opacity-50"
					>
						{#if reactivating}
							<span class="inline-flex items-center gap-1">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Reactivating...
							</span>
						{:else}
							Reactivate subscription
						{/if}
					</button>
				{/if}

				{#if canCancel}
					<button
						on:click={handleCancel}
						disabled={cancelling}
						class="px-3 py-2 text-xs font-bold text-red-600 bg-white rounded-lg border-2 border-red-200 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
					>
						{#if cancelling}
							<span class="inline-flex items-center gap-1">
								<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Cancelling...
							</span>
						{:else}
							Cancel subscription
						{/if}
					</button>
				{/if}

				{#if customerPortalUrl}
					<button
						on:click={openPortal}
						class="px-3 py-2 text-xs font-bold text-gray-700 bg-white rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all ml-auto"
					>
						Manage in LemonSqueezy
					</button>
				{/if}
			</div>

			{#if isPayPal && !canPause}
				<p class="text-xs text-gray-500 italic">
					* Pausing is not available for PayPal subscriptions. You can cancel and resubscribe instead.
				</p>
			{/if}
		</div>
	{:else}
		<!-- No Subscription -->
		<div class="p-5 text-center">
			<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
				<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
			</div>
			<h3 class="font-bold text-gray-900 mb-1">Free Plan</h3>
			<p class="text-sm text-gray-600 mb-4">
				You're currently on the free tier with limited renders per month.
			</p>
			<a
				href="/dashboard/upgrade"
				class="inline-flex items-center gap-2 px-4 py-2 bg-[#ffc480] text-gray-900 text-sm font-bold rounded-lg border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#1f2937] transition-all"
			>
				Upgrade to Pro
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
				</svg>
			</a>
		</div>
	{/if}
</div>
