<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '../../../store/user.store';
	import { getProducts } from '../../../api/product';
	import Loader from '$lib/components/Loader.svelte';
	import { analytics } from '$lib/analytics.js';

	let isLoading = true;
	let allPlans = [];
	let error = null;
	let showAllPlans = false;

	$: isLoggedIn = !!$user.email;
	$: currentPlan = $user.currentPlan || 'starter';

	// Featured plans to highlight
	const featuredPlanNames = ['Basic', 'Professional', 'Business'];
	
	$: featuredPlans = allPlans.filter(p => featuredPlanNames.includes(p.name));
	$: otherPlans = allPlans.filter(p => !featuredPlanNames.includes(p.name) && p.name !== 'Starter');

	// Plan quotas mapping
	const planQuotas = {
		'Starter': { templates: 10, aiCopilot: 3, brandAssets: 5 },
		'Basic': { templates: 50, aiCopilot: 50, brandAssets: 25 },
		'Standard': { templates: 50, aiCopilot: 50, brandAssets: 25 },
		'Professional': { templates: 200, aiCopilot: 200, brandAssets: 100 },
		'Advanced': { templates: 200, aiCopilot: 200, brandAssets: 100 },
		'Pro Plus': { templates: 200, aiCopilot: 200, brandAssets: 100 },
		'Business': { templates: 'Unlimited', aiCopilot: 500, brandAssets: 'Unlimited' },
		'Business Plus': { templates: 'Unlimited', aiCopilot: 500, brandAssets: 'Unlimited' },
		'Premium': { templates: 'Unlimited', aiCopilot: 1000, brandAssets: 'Unlimited' },
		'Premium Plus': { templates: 'Unlimited', aiCopilot: 1000, brandAssets: 'Unlimited' },
		'Enterprise': { templates: 'Unlimited', aiCopilot: 'Unlimited', brandAssets: 'Unlimited' },
		'Enterprise Plus': { templates: 'Unlimited', aiCopilot: 'Unlimited', brandAssets: 'Unlimited' },
	};

	function getQuotas(planName) {
		return planQuotas[planName] || planQuotas['Starter'];
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
			console.error('Failed to load plans:', err);
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

		// Track upgrade started
		analytics.trackUpgradeStarted({
			plan: plan.name,
			source: 'dashboard_upgrade',
			price: plan.price,
			requests: plan.request_per_month,
			current_plan: currentPlan
		});

		if (!isLoggedIn) {
			window.location.href = `/signup?redirect=${plan.purchase_url ?? '/dashboard/api-token'}`;
			return;
		}
		if (plan.purchase_url) {
			window.location.href = plan.purchase_url;
		} else {
			goto('/dashboard/api-token');
		}
	}
</script>

<svelte:head>
	<title>Upgrade Plan - Pictify.io</title>
</svelte:head>

<div>
	<div>
		<!-- Header -->
		<div class="mb-8 sm:mb-12">
			<div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-3">
				<span class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse"></span>
				Pricing Plans
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-2">
				Upgrade Your <span class="text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600">Plan</span>
			</h1>
			<p class="text-gray-600 font-medium">Unlock more renders, AI generations, and features</p>
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
			<!-- Featured Plans -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				{#each featuredPlans as plan}
					{@const isCurrent = isPlanCurrent(plan)}
					{@const isPopular = plan.name === 'Professional'}
					{@const quotas = getQuotas(plan.name)}
					
					<div class="relative bg-white rounded-xl border-[3px] {isPopular ? 'border-[#ff6b6b] shadow-[4px_4px_0_0_#ff6b6b80]' : 'border-gray-900 shadow-[4px_4px_0_0_#1f293780]'} {isCurrent ? 'opacity-60' : ''}">
						
						{#if isPopular}
							<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#ff6b6b] text-white text-[10px] font-bold rounded-full border-2 border-gray-900">
								Most Popular
							</div>
						{/if}

						<div class="p-4">
							<div class="mb-4">
								<h3 class="text-lg font-bold text-gray-900">{plan.name}</h3>
								<div class="flex items-baseline gap-1 mt-1">
									<span class="text-2xl font-bold text-gray-900">{plan.price_formatted?.replace('/month', '') || '$' + plan.price}</span>
									<span class="text-xs text-gray-500">/mo</span>
								</div>
								<p class="text-xs text-gray-500 mt-0.5">{formatRequests(plan.request_per_month)} renders/mo</p>
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
									Upgrade to {plan.name}
								</button>
							{/if}

							<div class="space-y-1.5 text-xs">
								<div class="flex items-center justify-between py-1 border-b border-gray-100">
									<span class="text-gray-600">Renders</span>
									<span class="font-bold text-gray-900">{formatRequests(plan.request_per_month)}/mo</span>
								</div>
								<div class="flex items-center justify-between py-1 border-b border-gray-100">
									<span class="text-gray-600">AI Copilot</span>
									<span class="font-bold text-gray-900">{quotas.aiCopilot === 'Unlimited' ? '∞' : quotas.aiCopilot + '/mo'}</span>
								</div>
								<div class="flex items-center justify-between py-1 border-b border-gray-100">
									<span class="text-gray-600">Templates</span>
									<span class="font-bold text-gray-900">{quotas.templates === 'Unlimited' ? '∞' : quotas.templates}</span>
								</div>
								<div class="flex items-center justify-between py-1">
									<span class="text-gray-600">Brand Assets</span>
									<span class="font-bold text-gray-900">{quotas.brandAssets === 'Unlimited' ? '∞' : quotas.brandAssets}</span>
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
									<th class="px-4 py-2 text-left font-bold text-gray-900">AI</th>
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
										<td class="px-4 py-2 text-gray-700">{formatRequests(plan.request_per_month)}</td>
										<td class="px-4 py-2 text-gray-700">{quotas.aiCopilot === 'Unlimited' ? '∞' : quotas.aiCopilot}</td>
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
	</div>
</div>
