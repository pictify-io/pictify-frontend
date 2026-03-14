<script>
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import {
		plgStatus,
		canUseFeature,
		trackFeatureUsage,
		handleUpgradeClick,
		featureGates,
		checkFeatureAccessSync,
		getFeatureUsageStatus,
		getFeatureUpgradePrompt,
		FEATURES,
		FEATURE_METADATA,
		PLAN_DISPLAY_NAMES,
		formatLimit
	} from '../../../store/plg.store';

	/**
	 * Feature name to gate - use FEATURES constants
	 * Options: 'renders', 'pdfOutput', 'templatesSaved', 'batchRender',
	 *          'aiBackgroundRemover', 'aiCopilot', 'webhooks', 'dynamicLinks', 'storageConnectors'
	 */
	export let feature;

	/**
	 * Amount to check/consume (default 1)
	 */
	export let amount = 1;

	/**
	 * Whether to show inline warning when limit is close
	 */
	export let showWarning = true;

	/**
	 * Show lock overlay when feature is not available
	 */
	export let showLockOverlay = true;

	/**
	 * Custom message when feature is locked
	 */
	export let lockMessage = null;

	/**
	 * Custom message when limit reached
	 */
	export let limitMessage = null;

	/**
	 * Callback when feature is allowed
	 */
	export let onAllowed = () => {};

	/**
	 * Callback when feature is blocked
	 */
	export let onBlocked = () => {};

	/**
	 * Callback when upgrade prompt is shown
	 */
	export let onUpgradePromptShown = () => {};

	let checking = false;
	let featureAccess = null;
	let usageStatus = null;
	let upgradePrompt = null;
	let showLimitBanner = false;

	// Feature display metadata
	$: metadata = FEATURE_METADATA[feature] || { name: feature, icon: 'zap' };
	$: featureName = metadata.name;

	// Feature icons mapping (SVG paths)
	const iconPaths = {
		image:
			'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
		film: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
		'file-text':
			'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
		folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
		layers:
			'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
		list: 'M4 6h16M4 10h16M4 14h16M4 18h16',
		wand: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V8m0-6v2m4-2v2m16.071 2.071l-1.414-1.414m0 0l-2.828 2.828m2.828-2.828l1.414 1.414m-12.071 8l-2.828 2.828m0 0l-1.414-1.414m1.414 1.414L3.93 19.93',
		sparkles:
			'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
		users:
			'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
		zap: 'M13 10V3L4 14h7v7l9-11h-7z',
		link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
		cloud:
			'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
		briefcase:
			'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
		shield:
			'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
		clipboard:
			'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
		tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 8V3c0-1.105.895-2 2-2z',
		code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
	};

	$: featureIconPath = iconPaths[metadata.icon] || iconPaths.zap;
	$: isPaidPlan = $plgStatus.isPaidPlan;
	$: currentPlan = $plgStatus.plan;

	// Reactive access check
	$: if (currentPlan) {
		featureAccess = checkFeatureAccessSync(feature);
		usageStatus = getFeatureUsageStatus(feature);
		upgradePrompt = getFeatureUpgradePrompt(feature);
	}

	// Determine gate status
	$: hasAccess = featureAccess?.hasAccess ?? true;
	$: isLimited = typeof featureAccess?.limit === 'number';
	$: isUnlimited = featureAccess?.isUnlimited ?? false;

	// For limited features, check remaining usage
	$: isNearLimit = isLimited && usageStatus?.remaining <= 2 && usageStatus?.remaining > 0;
	$: isAtLimit = isLimited && usageStatus?.remaining === 0;

	// Show warning banner conditions
	$: shouldShowWarning = showWarning && hasAccess && (isNearLimit || isAtLimit);

	onMount(async () => {
		if (hasAccess && isLimited) {
			// Refresh usage from backend for limited features
			await refreshUsage();
		}
	});

	async function refreshUsage() {
		if (!hasAccess || isUnlimited) return;

		checking = true;
		try {
			const result = await canUseFeature(feature, amount);
			// Update local state based on result
			if (result.remaining !== undefined) {
				showLimitBanner = result.remaining <= 2;
			}
			if (result.limitExceeded) {
				showLimitBanner = true;
			}
		} catch (error) {
			console.error('Failed to check feature:', error);
		} finally {
			checking = false;
		}
	}

	/**
	 * Check if feature can be used and optionally consume usage
	 */
	export async function tryUseFeature(consume = true) {
		// First check local access
		if (!hasAccess) {
			onBlocked();
			onUpgradePromptShown();
			return false;
		}

		// For unlimited features, allow immediately
		if (isUnlimited) {
			onAllowed();
			return true;
		}

		// For limited features, check with backend
		await refreshUsage();

		if (isAtLimit) {
			onBlocked();
			return false;
		}

		if (consume) {
			await trackFeatureUsage(feature, amount);
			await refreshUsage();
		}

		onAllowed();
		return true;
	}

	function dismissBanner() {
		showLimitBanner = false;
	}

	function handleUpgrade() {
		handleUpgradeClick({
			type: 'feature_gate',
			feature,
			...upgradePrompt
		});
	}
</script>

<!-- Slot for gated content -->
{#if checking}
	<slot name="loading">
		<div class="flex items-center justify-center p-4">
			<div class="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
		</div>
	</slot>
{:else if !hasAccess && showLockOverlay}
	<!-- Feature not available on current plan -->
	<div class="relative">
		<!-- Lock overlay -->
		<div
			class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center p-4"
		>
			<div
				class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-6 max-w-sm w-full text-center relative overflow-hidden"
			>
				<!-- Decorative bg pattern -->
				<div
					class="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"
				/>

				<div class="relative z-10">
					<div
						class="w-16 h-16 mx-auto mb-4 bg-[#ffc480] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center transform hover:scale-105 transition-transform duration-200"
					>
						<svg
							class="w-8 h-8 text-gray-900"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={featureIconPath}
							/>
						</svg>
					</div>

					<h3 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
						{lockMessage || `${featureName} Locked`}
					</h3>
					<p class="text-sm font-medium text-gray-600 mb-6 leading-relaxed">
						{upgradePrompt?.message ||
							`Upgrade to ${
								upgradePrompt?.targetPlanName || 'a higher plan'
							} to unlock ${featureName.toLowerCase()}.`}
					</p>

					{#if upgradePrompt?.benefit}
						<div
							class="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10b981]/10 text-gray-900 border border-[#10b981]/30 rounded-md text-xs font-black mb-5 transform -rotate-1"
						>
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={iconPaths.sparkles}
								/>
							</svg>
							{upgradePrompt.benefit}
						</div>
					{/if}

					<button
						class="w-full py-3 px-4 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						on:click={handleUpgrade}
					>
						Upgrade to {upgradePrompt?.targetPlanName || 'Unlock'}
					</button>

					<p class="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-wider">
						Available on {PLAN_DISPLAY_NAMES[upgradePrompt?.targetPlan] || 'higher'} plan
					</p>
				</div>
			</div>
		</div>

		<!-- Blurred content preview -->
		<div class="filter blur-sm pointer-events-none opacity-40 select-none">
			<slot />
		</div>
	</div>
{:else if hasAccess && isAtLimit}
	<!-- Feature limit reached -->
	<div class="relative">
		<!-- Limit reached overlay -->
		<div
			class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center p-4"
		>
			<div
				class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-6 max-w-sm w-full text-center relative overflow-hidden"
			>
				<div class="absolute top-0 left-0 w-full h-1.5 bg-[#ff6b6b] border-b border-gray-900" />

				<div class="relative z-10 mt-2">
					<div
						class="w-16 h-16 mx-auto mb-4 bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center"
					>
						<svg
							class="w-8 h-8 text-gray-900"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={featureIconPath}
							/>
						</svg>
					</div>

					<h3 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
						Limit Reached
					</h3>
					<p class="text-sm font-medium text-gray-600 mb-6">
						{limitMessage ||
							`You've used all ${formatLimit(
								featureAccess.limit
							)} ${featureName.toLowerCase()} for this month.`}
					</p>

					{#if upgradePrompt}
						<button
							class="w-full py-3 px-4 bg-[#ffc480] text-gray-900 font-black uppercase tracking-widest text-xs rounded-lg border-2 border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							on:click={handleUpgrade}
						>
							Upgrade for {upgradePrompt.targetLimit === null
								? 'Unlimited'
								: `${formatLimit(upgradePrompt.targetLimit)}/mo`}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Blurred content preview -->
		<div class="filter blur-sm pointer-events-none select-none">
			<slot />
		</div>
	</div>
{:else}
	<!-- Feature is available -->
	<div class="relative">
		<!-- Warning banner when limit is close -->
		{#if shouldShowWarning && showLimitBanner && usageStatus?.remaining > 0}
			<div
				class="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3"
				transition:slide={{ duration: 200 }}
			>
				<div class="p-1 bg-amber-100 rounded">
					<svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div class="flex-1">
					<p class="text-sm text-amber-900 font-bold">
						Only {usageStatus.remaining}
						{featureName} use{usageStatus.remaining !== 1 ? 's' : ''} remaining
					</p>
					<p class="text-xs text-amber-700 mt-0.5 font-medium">
						Upgrade for {upgradePrompt?.targetLimit === null ? 'unlimited' : 'more'} access
					</p>
				</div>
				<button class="text-amber-500 hover:text-amber-700" on:click={dismissBanner}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		{/if}

		<slot />
	</div>
{/if}

<!-- Usage indicator slot -->
{#if hasAccess && isLimited && !isPaidPlan}
	<slot name="usage-badge" remaining={usageStatus?.remaining} limit={featureAccess?.limit} />
{/if}
