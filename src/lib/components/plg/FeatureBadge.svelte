<script>
	import {
		plgStatus,
		FEATURES,
		PLAN_DISPLAY_NAMES,
		getMinimumPlan,
		hasFeatureAccess,
		getFeatureLimit,
		formatLimit
	} from '../../../store/plg.store';

	/**
	 * Feature to show badge for
	 */
	export let feature;

	/**
	 * Badge size
	 */
	export let size = 'sm'; // 'xs' | 'sm' | 'md'

	/**
	 * Show limit remaining if applicable
	 */
	export let showLimit = false;

	/**
	 * Custom usage count (if tracking externally)
	 */
	export let usage = null;

	$: currentPlan = $plgStatus.plan;
	$: hasAccess = hasFeatureAccess(currentPlan, feature);
	$: limit = getFeatureLimit(currentPlan, feature);
	$: minPlan = getMinimumPlan(feature);
	$: minPlanName = PLAN_DISPLAY_NAMES[minPlan];

	// Calculate remaining if we have usage and a numeric limit
	$: remaining = typeof limit === 'number' && usage !== null ? Math.max(0, limit - usage) : null;

	// Size classes
	$: sizeClasses = {
		xs: 'text-[10px] px-1.5 py-0.5',
		sm: 'text-xs px-2 py-0.5',
		md: 'text-sm px-2.5 py-1'
	}[size];
</script>

{#if !hasAccess}
	<!-- Feature not available - show plan badge -->
	<span
		class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 text-gray-900 font-bold border-2 border-gray-200 uppercase tracking-tight {sizeClasses}"
	>
		<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2.5"
				d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
			/>
		</svg>
		{minPlanName}+
	</span>
{:else if showLimit && typeof limit === 'number'}
	<!-- Feature available with limit - show usage -->
	{#if remaining !== null}
		<span
			class="inline-flex items-center gap-1.5 rounded-md font-black border-2 {sizeClasses} {remaining <=
			2
				? 'bg-[#ff6b6b] text-white border-gray-900'
				: 'bg-[#10b981] text-gray-900 border-gray-900'}"
		>
			{remaining}/{formatLimit(limit)}
		</span>
	{:else}
		<span
			class="inline-flex items-center gap-1.5 rounded-md bg-white text-gray-900 font-black border-2 border-gray-900 {sizeClasses}"
		>
			{formatLimit(limit)}/mo
		</span>
	{/if}
{:else if limit === null && hasAccess}
	<!-- Unlimited access -->
	<span
		class="inline-flex items-center gap-1.5 rounded-md bg-[#10b981] text-gray-900 font-black border-2 border-gray-900 {sizeClasses}"
	>
		<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
		</svg>
		Unlimited
	</span>
{/if}
