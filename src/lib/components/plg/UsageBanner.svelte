<script>
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import {
		plgStatus,
		usageWidget,
		overageState,
		isOverageEnabled,
		shouldShowUsageBanner,
		dismissUsageBanner,
		initNudgeState,
		getDiscountForUsage
	} from '../../../store/plg.store';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';
	import { recordUpgradePrompt } from '../../../api/plg.js';
	import { analytics } from '$lib/analytics.js';
	import { goto } from '$app/navigation';

	let showBanner = false;
	let mounted = false;
	let lastShownAtPercentage = null;

	// Get discount info based on current usage
	$: discountInfo = getDiscountForUsage($usageWidget.percentage);
	$: hasDiscount = discountInfo !== null;

	// Overage state
	$: overageEnabled = $isOverageEnabled;
	$: overageRate = $overageState.ratePerRenderFormatted;

	// Dynamic copy based on urgency
	$: headline = getHeadline($usageWidget.percentage);
	$: subline = getSubline($usageWidget.percentage, discountInfo);
	$: ctaText = getCtaText(discountInfo);
	$: bannerStyle = getBannerStyle($usageWidget.percentage);

	function getHeadline(percentage) {
		// If overages are enabled and at/over limit, show different messaging
		if (percentage >= 100 && overageEnabled) return 'Now using overage renders';
		if (percentage >= 100) return "You've hit your limit";
		if (percentage >= 95) return 'Almost out of renders';
		if (percentage >= 85) return 'Running low on renders';
		return "Don't lose your momentum";
	}

	function getSubline(percentage, discount) {
		// If overages are enabled and at/over limit, show overage rate
		if (percentage >= 100 && overageEnabled) {
			return `Additional renders are billed at ${overageRate}/render.`;
		}
		if (percentage >= 100) return 'Upgrade now to keep creating.';
		if (percentage >= 95)
			return discount
				? `Upgrade now and save ${discount.discountPercent}%.`
				: 'Upgrade to keep creating.';
		if (percentage >= 85)
			return discount
				? `Lock in ${discount.discountPercent}% off before you hit your limit.`
				: 'Upgrade to avoid interruption.';
		return "Your next render shouldn't have to wait until next month.";
	}

	function getCtaText(discount) {
		// If at limit with overages enabled, show different CTA
		if ($usageWidget.percentage >= 100 && overageEnabled) return 'Manage overages';
		if (discount) return `Save ${discount.discountPercent}%`;
		return 'Keep creating';
	}

	function getBannerStyle(percentage) {
		if (percentage >= 95) return 'bg-[#ff6b6b]'; // Critical - red
		if (percentage >= 85) return 'bg-[#f59e0b]'; // Urgent - orange
		return 'bg-[#ffc480]'; // Default - yellow
	}

	onMount(() => {
		mounted = true;
		initNudgeState();
		checkBannerVisibility();
	});

	function checkBannerVisibility() {
		const wasShown = showBanner;
		showBanner = shouldShowUsageBanner();
		if (showBanner && (!wasShown || lastShownAtPercentage !== $usageWidget.percentage)) {
			lastShownAtPercentage = $usageWidget.percentage;
			analytics.track('usage_banner_shown', {
				percentage: $usageWidget.percentage,
				plan: $usageWidget.plan,
				discount_code: discountInfo?.discountCode
			});
			recordUpgradePrompt('shown', 'usage_banner', {
				percentage: $usageWidget.percentage,
				discount_code: discountInfo?.discountCode || null
			});
		}
	}

	// Re-check when usage changes
	$: if (mounted && $plgStatus.loaded) {
		checkBannerVisibility();
	}

	function handleDismiss() {
		analytics.track('usage_banner_dismissed', {
			percentage: $usageWidget.percentage,
			plan: $usageWidget.plan
		});
		recordUpgradePrompt('dismissed', 'usage_banner', {
			percentage: $usageWidget.percentage
		});
		dismissUsageBanner();
		showBanner = false;
	}

	function handleUpgradeClick() {
		analytics.track('usage_banner_upgrade_clicked', {
			percentage: $usageWidget.percentage,
			plan: $usageWidget.plan,
			discount_code: discountInfo?.discountCode,
			overage_enabled: overageEnabled
		});
		recordUpgradePrompt('clicked', 'usage_banner', {
			percentage: $usageWidget.percentage,
			discount_code: discountInfo?.discountCode || null
		});

		// If at limit with overages enabled, go to billing settings instead
		if ($usageWidget.percentage >= 100 && overageEnabled) {
			goto('/dashboard/billing');
			return;
		}

		openUpgradeModal('usage_banner', discountInfo?.discountCode || null);
	}
</script>

{#if showBanner}
	<div
		class="w-full {bannerStyle} border-b-[3px] border-gray-900 shadow-sm relative z-40"
		transition:slide={{ duration: 200 }}
	>
		<div class="max-w-7xl mx-auto px-4 py-3">
			<div class="flex items-center justify-between gap-4">
				<!-- Left: Message -->
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 mb-0.5">
						<div class="w-2 h-2 rounded-full bg-black animate-pulse" />
						<p class="text-sm font-black text-gray-900 uppercase tracking-widest">
							{headline}
						</p>
						{#if hasDiscount}
							<span
								class="px-2 py-0.5 bg-white rounded text-xs font-black text-gray-900 border border-gray-900"
							>
								{discountInfo.discountPercent}% OFF
							</span>
						{/if}
					</div>
					<p class="text-xs font-bold text-gray-800">
						{subline}
					</p>
				</div>

				<!-- Right: CTA and dismiss -->
				<div class="flex items-center gap-3 flex-shrink-0">
					<button
						class="px-4 py-2 bg-gray-900 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg border-2 border-gray-900 shadow-[3px_3px_0_0_#FFFDF8] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#FFFDF8] hover:bg-black transition-all whitespace-nowrap flex items-center gap-2 group"
						on:click={handleUpgradeClick}
					>
						{ctaText}
						<svg
							class="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</button>

					<button
						class="p-1.5 text-gray-900 hover:bg-gray-900/10 rounded-lg border-2 border-transparent hover:border-gray-900 transition-colors"
						on:click={handleDismiss}
						aria-label="Dismiss banner"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
