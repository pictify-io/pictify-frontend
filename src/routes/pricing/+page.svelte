<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { getProducts } from '../../api/product';
	import { onMount, onDestroy } from 'svelte';
	import { user } from '../../store/user.store';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/analytics.js';
	import { fade, fly } from 'svelte/transition';
	import {
		PLANS,
		PLAN_DISPLAY_NAMES,
		PLAN_PRICING,
		PLAN_ORDER,
		FEATURES,
		PLAN_FEATURES,
		FEATURE_METADATA,
		FEATURE_CATEGORIES,
		formatLimit,
		OVERAGE_PRICING,
		formatOverageRate,
	} from '../../config/plan-features.js';

	let plans = [];
	let selectedPlanIndex = 0;
	let didManuallySelect = false;
	let requestsNeeded = 1500;
	let maxRequests = 0;
	let minRequests = 0;
	let recommendedPlanIndex = 0;
	let selectedPlan = null;
	let sliderIndex = 0;
	let showAnnual = false;

	const numberFormatter = new Intl.NumberFormat('en-US');
	const popularPlanNames = ['Pro'];

	// Feature comparison data for the table
	const featureComparisonRows = [
		// Core Features
		{ category: 'Core Features', features: [
			{ label: 'Monthly Renders', feature: FEATURES.RENDERS, unit: '/mo' },
			{ label: 'API Access', feature: FEATURES.API_ACCESS, description: 'Full API, no rate limits' },
		]},
		// Output Formats
		{ category: 'Output Formats', features: [
			{ label: 'PNG & JPG', feature: null, allPlans: true },
			{ label: 'GIF Output', feature: FEATURES.GIF_OUTPUT, unit: '/mo' },
			{ label: 'PDF Export', feature: FEATURES.PDF_OUTPUT },
		]},
		// Templates & Assets
		{ category: 'Templates & Assets', features: [
			{ label: 'Saved Templates', feature: FEATURES.TEMPLATES_SAVED },
			{ label: 'Brand Assets', feature: FEATURES.BRAND_ASSETS },
		]},
		// Automation
		{ category: 'Automation', features: [
			{ label: 'Batch Rendering', feature: FEATURES.BATCH_RENDER },
			{ label: 'Items per Batch', feature: FEATURES.BATCH_ITEMS_PER_REQUEST },
			{ label: 'Webhooks', feature: FEATURES.WEBHOOKS },
			{ label: 'Live Links', feature: FEATURES.DYNAMIC_LINKS },
		]},
		// AI Features
		{ category: 'AI Features', features: [
			{ label: 'AI Background Remover', feature: FEATURES.AI_BACKGROUND_REMOVER, unit: '/mo' },
			{ label: 'AI Copilot', feature: FEATURES.AI_COPILOT, unit: '/mo' },
		]},
		// Team & Enterprise
		{ category: 'Team & Enterprise', features: [
			{ label: 'Team Seats', feature: FEATURES.TEAM_SEATS },
			{ label: 'Storage Connectors', feature: FEATURES.STORAGE_CONNECTORS, description: 'S3, GCS, Cloudinary' },
			{ label: 'SSO/SAML', feature: FEATURES.SSO_SAML },
			{ label: 'Audit Logs', feature: FEATURES.AUDIT_LOGS },
			{ label: 'White Label', feature: FEATURES.WHITE_LABEL },
		]},
	];

	// Plans to show in comparison - 3-tier Good-Better-Best structure
	// Free (entry) → Pro (recommended, best value) → Business (enterprise)
	const comparisonPlans = [PLANS.STARTER, PLANS.STANDARD, PLANS.BUSINESS];

	const FAQs = [
		{
			question: 'What happens if I exceed the monthly limit?',
			answer:
				`Pro and Business users can enable <strong>overage billing</strong> to keep rendering beyond their limit. Pro: ${formatOverageRate(PLANS.STANDARD)}/render, Business: ${formatOverageRate(PLANS.BUSINESS)}/render. Set a monthly spending cap to control costs. Free tier users need to upgrade to continue.`,
			isOpened: false
		},
		{
			question: 'Can I change my plan later?',
			answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings.',
			isOpened: false
		},
		{
			question: 'What features are included in the free plan?',
			answer: 'The Free plan includes 50 renders/month, 5 GIF renders, 3 saved templates, PNG/JPG output, and full API access with no rate limits. Perfect for testing and hobby projects.',
			isOpened: false
		},
		{
			question: 'Is there a discount for annual billing?',
			answer: 'Yes! Save up to 20% with annual billing. Toggle the billing switch above to see annual prices.',
			isOpened: false
		},
		{
			question: 'Do you offer custom enterprise plans?',
			answer:
				"Yes, we offer custom plans for high-volume users. Please contact us at <a href='mailto:support@pictify.io'>support@pictify.io</a> for more information.",
			isOpened: false
		},
		{
			question: 'What AI features are available?',
			answer: 'Both AI Background Remover and AI Copilot are included in the Pro plan. Business plan includes unlimited AI Copilot usage.',
			isOpened: false
		}
	];

	let isLoggedIn = false;
	let unsubscribe = () => {};

	onMount(async () => {
		analytics.trackPricingViewed({ source: 'public_pricing' });

		const response = await getProducts();
		plans = (response?.data ?? [])
			.filter((plan) => plan && typeof plan.request_per_month === 'number')
			.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

		if (plans.length) {
			const defaultPlanIndex = plans.findIndex((plan) => plan.request_per_month >= requestsNeeded);
			selectedPlanIndex = defaultPlanIndex >= 0 ? defaultPlanIndex : plans.length - 1;
			requestsNeeded = plans[selectedPlanIndex].request_per_month;
			sliderIndex = selectedPlanIndex;
		}

		unsubscribe = user.subscribe((u) => {
			isLoggedIn = !!u.email;
		});
	});

	onDestroy(() => {
		isLoggedIn = false;
		unsubscribe();
	});

	const sliderStep = 50;

	const ensureNumber = (value) => {
		if (typeof value === 'number') return value;
		const numeric = Number(value ?? 0);
		return Number.isNaN(numeric) ? null : numeric;
	};

	const clampRequests = (value) => {
		if (!plans.length) return ensureNumber(value) ?? 0;
		const numeric = ensureNumber(value);
		if (numeric === null) return minRequests || 0;
		const min = minRequests || 0;
		const max = maxRequests || numeric;
		if (numeric < min) return min;
		if (numeric > max) return max;
		return numeric;
	};

	const formatRequests = (value) => {
		const numeric = ensureNumber(value);
		if (numeric === null) return '-';
		if (numeric >= 1_000_000) {
			return `${(numeric / 1_000_000).toFixed(numeric % 1_000_000 === 0 ? 0 : 1)}M requests/mo`;
		}
		if (numeric >= 1_000) {
			return `${(numeric / 1_000).toFixed(numeric % 1_000 === 0 ? 0 : 1)}K requests/mo`;
		}
		return `${numberFormatter.format(numeric)} requests/mo`;
	};

	const formatRequestsShort = (value) => {
		const numeric = ensureNumber(value);
		if (numeric === null) return '-';
		if (numeric >= 1_000_000) {
			return `${(numeric / 1_000_000).toFixed(numeric % 1_000_000 === 0 ? 0 : 1)}M`;
		}
		if (numeric >= 1_000) {
			return `${(numeric / 1_000).toFixed(numeric % 1_000 === 0 ? 0 : 1)}K`;
		}
		return numberFormatter.format(numeric);
	};

	const selectPlanHandler = (planName) => {
		const planIndex = plans.findIndex(p => p.name?.toLowerCase() === planName?.toLowerCase());
		const plan = planIndex >= 0 ? plans[planIndex] : null;

		// Use annual URL if available and annual billing is selected
		const purchaseUrl = showAnnual && plan?.purchase_url_annual
			? plan.purchase_url_annual
			: plan?.purchase_url;

		analytics.trackUpgradeStarted({
			plan: planName,
			source: 'pricing_page',
			price: plan?.price || PLAN_PRICING[planName]?.[showAnnual ? 'annual' : 'monthly'],
			requests: plan?.request_per_month,
			billing_interval: showAnnual ? 'annual' : 'monthly'
		});

		if (!isLoggedIn) {
			goto(`/signup?redirect=/dashboard/upgrade${showAnnual ? '?billing=annual' : ''}`);
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

			// Join all parameters with the checkout URL
			if (customParams.length > 0) {
				const separator = checkoutUrl.includes('?') ? '&' : '?';
				checkoutUrl = `${checkoutUrl}${separator}${customParams.join('&')}`;
			}

			window.location.href = checkoutUrl;
		} else {
			goto(`/dashboard/upgrade${showAnnual ? '?billing=annual' : ''}`);
		}
	};

	const handleRequestsChange = (value) => {
		const numeric = clampRequests(value);
		didManuallySelect = false;
		requestsNeeded = numeric;
	};

	const handlePlanClick = (index) => {
		didManuallySelect = true;
		selectedPlanIndex = index;
		sliderIndex = index;
		const plan = plans[index];
		if (plan?.request_per_month) {
			requestsNeeded = plan.request_per_month;
		}
	};

	const purchasePlan = (event, index) => {
		event?.stopPropagation?.();
		const plan = plans[index];
		selectPlanHandler(plan?.name);
	};

	const handleRowKeyDown = (event, index) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handlePlanClick(index);
		}
	};

	const clampSliderIndex = (value) => {
		if (!plans.length) return 0;
		const numeric = Math.round(Number(value ?? 0));
		if (Number.isNaN(numeric)) return 0;
		if (numeric < 0) return 0;
		if (numeric >= plans.length) return plans.length - 1;
		return numeric;
	};

	const handleSliderChange = (value) => {
		const index = clampSliderIndex(value);
		sliderIndex = index;
		didManuallySelect = false;
		selectedPlanIndex = index;
		const plan = plans[index];
		if (plan?.request_per_month) {
			requestsNeeded = plan.request_per_month;
		}
	};

	const resetToRecommendation = () => {
		didManuallySelect = false;
		const plan = plans[recommendedPlanIndex];
		if (plan?.request_per_month) {
			requestsNeeded = plan.request_per_month;
		}
		sliderIndex = recommendedPlanIndex;
	};

	// Format feature value for display in comparison table
	function formatFeatureValue(planId, feature, unit = '') {
		if (!feature) return null;
		const value = PLAN_FEATURES[planId]?.[feature];
		if (value === null) return 'Unlimited';
		if (value === true) return true;
		if (value === false) return false;
		if (typeof value === 'number') {
			return formatLimit(value) + unit;
		}
		return value;
	}

	// Get price for a plan (pass isAnnual for Svelte reactivity)
	function getPlanPrice(planId, isAnnual = false) {
		const pricing = PLAN_PRICING[planId];
		if (!pricing) return 'Custom';
		const price = isAnnual ? pricing.annual : pricing.monthly;
		if (price === null) return 'Custom';
		if (price === 0) return 'Free';
		return `$${price}`;
	}

	$: maxRequests = plans.length
		? Math.max(...plans.map((plan) => plan.request_per_month ?? 0))
		: 0;

	$: minRequests = plans.length
		? Math.min(...plans.map((plan) => plan.request_per_month ?? 0))
		: 0;

	$: requestsNeeded = clampRequests(requestsNeeded);

	$: recommendedPlanIndex = plans.length
		? plans.findIndex((plan) => plan.request_per_month >= requestsNeeded)
		: 0;

	$: recommendedPlanIndex =
		recommendedPlanIndex === -1 && plans.length ? plans.length - 1 : recommendedPlanIndex;

	$: if (plans.length && !didManuallySelect && recommendedPlanIndex !== selectedPlanIndex) {
		selectedPlanIndex = recommendedPlanIndex;
	}

	$: selectedPlan = plans[selectedPlanIndex] ?? null;

	$: if (plans.length) {
		const clamped = clampSliderIndex(sliderIndex);
		if (clamped !== sliderIndex) {
			sliderIndex = clamped;
		}
	}

	$: if (plans.length && selectedPlanIndex !== clampSliderIndex(sliderIndex)) {
		sliderIndex = clampSliderIndex(selectedPlanIndex);
	}
</script>

<section class="bg-[#FFFDF8] min-h-screen overflow-x-hidden">
	<Nav />
	<main class="relative z-10">
		<div class="relative py-24 lg:py-32">
			<!-- Background Grid for Density -->
			<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>

			<div class="relative mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-6 md:px-10">
				
				<!-- Hero Content -->
				<div class="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto relative z-10 pt-12">
					<!-- Pill Badge -->
					<div class="inline-flex items-center gap-2 px-5 py-2 bg-white rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] mb-4 transform -rotate-1 hover:rotate-0 transition-transform">
						<span class="w-2.5 h-2.5 bg-[#ff6b6b] rounded-full animate-pulse"></span>
						<span class="text-xs font-black text-gray-900 uppercase tracking-widest">No Hidden Fees</span>
					</div>

					<h1 class="text-5xl md:text-7xl font-black text-gray-900 tracking-[-0.03em] leading-tight mb-6">
						Simple, transparent <br />
						<span class="relative inline-block text-[#ff6b6b] mt-1">
							Pricing
							<svg class="absolute w-[105%] h-6 -bottom-2 -left-[2.5%] text-gray-900 opacity-100" viewBox="0 0 100 10" preserveAspectRatio="none">
								<path d="M0 5 Q 50 15 100 5" stroke="currentColor" stroke-width="4" fill="none" />
							</svg>
						</span>
					</h1>
					
					<p class="text-lg md:text-2xl text-gray-700 font-bold max-w-3xl leading-relaxed tracking-tight">
						Stop overpaying for renders. Get full API access, <br class="hidden md:block"/> high-performance infrastructure, and 
						<span class="relative inline-block px-2 mx-1">
							<span class="absolute inset-0 bg-[#4ade80]/30 -skew-y-2 rounded-lg border-2 border-transparent"></span>
							<span class="relative text-gray-900">scale as you grow.</span>
						</span>
					</p>

					<!-- Chunky Billing Toggle -->
					<div class="mt-10 relative inline-flex p-2 bg-white rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]">
						<div class="absolute -top-4 -right-4 z-20">
							<span class="px-3 py-1.5 bg-[#ff6b6b] text-white text-[11px] font-black uppercase tracking-widest rounded border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000] rotate-12 block transform origin-bottom-left animate-bounce [animation-duration:3s]">
								Save 20%
							</span>
						</div>
						
						<button 
							class="relative z-10 px-10 py-4 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-200 {!showAnnual ? 'bg-[#ffc480] text-gray-900 shadow-sm border-2 border-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}"
							on:click={() => showAnnual = false}
						>
							Monthly
						</button>
						<button 
							class="relative z-10 px-10 py-4 rounded-lg text-sm font-black uppercase tracking-widest transition-all duration-200 {showAnnual ? 'bg-[#ffc480] text-gray-900 shadow-sm border-2 border-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}"
							on:click={() => showAnnual = true}
						>
							Annual
						</button>
					</div>

					<!-- Trust/Social Proof -->
					<div class="mt-8 flex items-center gap-2 text-sm font-bold text-gray-500">
						<svg class="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
						<span>Cancel anytime. No credit card required for free tier.</span>
					</div>
				</div>

				<!-- Plan Cards Grid --> 
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-10 items-stretch justify-center relative z-10 max-w-5xl mx-auto">
					{#each comparisonPlans as planId (planId + '-' + showAnnual)}
						{@const isPopular = popularPlanNames.includes(PLAN_DISPLAY_NAMES[planId])}
						{@const price = getPlanPrice(planId, showAnnual)}
						{@const renders = PLAN_FEATURES[planId]?.[FEATURES.RENDERS]}
						
						<div 
							class="relative flex flex-col p-6 h-full bg-white rounded-2xl border-[3px] border-gray-900 transition-all duration-300
							{isPopular 
								? 'shadow-[12px_12px_0_0_#1f2937] lg:-mt-6 lg:mb-6 z-20 scale-[1.02] bg-[#FFFDF8]' 
								: 'shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] hover:-translate-y-1'}"
						>
							{#if isPopular}
								<div class="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#ffc480] text-gray-900 text-xs font-black uppercase tracking-widest rounded-lg border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f2937] whitespace-nowrap z-30">
									Most Popular
								</div>
							{/if}

							<div class="mb-6 border-b-[3px] border-gray-100 pb-6 relative">
								<!-- Card Decoration -->
								<div class="absolute -top-2 -right-2 w-8 h-8 opacity-10 bg-gray-900 rounded-full"></div>
								
								<h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">{PLAN_DISPLAY_NAMES[planId]}</h3>
								<p class="text-sm font-bold text-gray-500 mt-2 min-h-[40px] leading-snug">
									{#if planId === PLANS.STARTER}
										Perfect for experimenting and side projects.
									{:else if planId === PLANS.STANDARD}
										For teams & startups scaling their image generation.
									{:else if planId === PLANS.BUSINESS}
										Unlimited scale, enterprise security & dedicated support.
									{:else}
										Flexible plan for your needs.
									{/if}
								</p>
							</div>

							<div class="mb-8">
								<div class="flex items-baseline gap-2">
									{#if showAnnual && PLAN_PRICING[planId]?.monthly > 0}
										<span class="text-2xl font-bold text-gray-400 line-through">${PLAN_PRICING[planId].monthly}</span>
									{/if}
									<span class="text-5xl font-black text-gray-900 tracking-tighter">{price}</span>
									{#if price !== 'Free' && price !== 'Custom'}
										<span class="text-gray-500 font-bold text-lg">/mo</span>
									{/if}
								</div>
								{#if showAnnual && PLAN_PRICING[planId]?.monthly > 0}
									{@const monthlyCost = PLAN_PRICING[planId].monthly}
									{@const annualCost = PLAN_PRICING[planId].annual}
									{@const yearlySavings = (monthlyCost - annualCost) * 12}
									<div class="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-bold rounded-md border border-[#10b981]/30">
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
										Save ${yearlySavings}/year
									</div>
								{/if}
							</div>

							<ul class="space-y-4 flex-1 mb-8">
								<!-- Render Limit (Highlighted) -->
								<li class="flex items-start gap-3 text-sm font-bold text-gray-900 bg-gray-50 p-3 rounded-lg border-2 border-gray-200 border-dashed">
									<div class="w-6 h-6 rounded bg-[#c6e0ff] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]">
										<svg class="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<div class="flex flex-col mt-0.5">
										<span><strong>{formatLimit(renders)}</strong> renders/mo</span>
										{#if OVERAGE_PRICING[planId]?.eligible}
											<span class="text-xs text-gray-500 font-normal">then {formatOverageRate(planId)}/render</span>
										{/if}
									</div>
								</li>
								
									<!-- Specific Features with Icons -->
								{#if PLAN_FEATURES[planId]?.[FEATURES.BATCH_RENDER]}
									<li class="flex items-start gap-3 text-sm font-bold text-gray-800 px-3">
										<div class="w-6 h-6 rounded bg-[#a2ffc1] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]">
											<svg class="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
											</svg>
										</div>
										<span class="mt-0.5">Batch processing</span>
									</li>
								{/if}
								{#if PLAN_FEATURES[planId]?.[FEATURES.AI_BACKGROUND_REMOVER]}
									<li class="flex items-start gap-3 text-sm font-bold text-gray-800 px-3">
										<div class="w-6 h-6 rounded bg-[#ffc480] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]">
											<svg class="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
											</svg>
										</div>
										<span class="mt-0.5">AI Tools</span>
									</li>
								{/if}
								{#if PLAN_FEATURES[planId]?.[FEATURES.TEAM_SEATS] !== 1}
									<li class="flex items-start gap-3 text-sm font-bold text-gray-800 px-3">
										<div class="w-6 h-6 rounded bg-[#e5e7eb] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]">
											<svg class="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
											</svg>
										</div>
										<span class="mt-0.5">{formatLimit(PLAN_FEATURES[planId]?.[FEATURES.TEAM_SEATS])} team seats</span>
									</li>
								{/if}
								{#if PLAN_FEATURES[planId]?.[FEATURES.STORAGE_CONNECTORS]}
									<li class="flex items-start gap-3 text-sm font-bold text-gray-800 px-3">
										<div class="w-6 h-6 rounded bg-[#c6e0ff] border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]">
											<svg class="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
											</svg>
										</div>
										<span class="mt-0.5">Cloud storage</span>
									</li>
								{/if}
								{#if PLAN_FEATURES[planId]?.[FEATURES.SSO_SAML]}
									<li class="flex items-start gap-3 text-sm font-bold text-gray-800 px-3">
										<div class="w-6 h-6 rounded bg-[#ff6b6b]/20 border-2 border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0_0_#1f2937]">
											<svg class="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
											</svg>
										</div>
										<span class="mt-0.5">SSO & Security</span>
									</li>
								{/if}
							</ul>

							<button
								class="w-full py-4 px-6 rounded-xl font-black text-sm uppercase tracking-widest border-[3px] border-gray-900 transition-all 
								{isPopular 
									? 'bg-[#ffc480] text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1f2937]' 
									: 'bg-white text-gray-900 hover:bg-gray-50 shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1f2937]'}"
								on:click={() => selectPlanHandler(planId)}
							>
								{planId === PLANS.STARTER ? 'Start Free' : planId === PLANS.BUSINESS ? 'Talk to Sales' : 'Get Started'}
							</button>
						</div>
					{/each}
				</div>

				<!-- Feature Comparison Table -->
				<div class="flex flex-col gap-10 mt-16 max-w-6xl mx-auto w-full relative z-10">
					<!-- Table Decoration -->
					<div class="absolute -top-10 -left-10 w-24 h-24 bg-[#a2ffc1] rounded-full blur-[60px] opacity-50 pointer-events-none"></div>

					<div class="text-center">
						<h2 class="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Compare Features</h2>
						<p class="text-xl text-gray-700 font-bold max-w-2xl mx-auto">Detailed breakdown of everything included.</p>
					</div>

					<div class="overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-white shadow-[8px_8px_0_0_#1f2937]">
						<div class="overflow-x-auto">
							<table class="w-full min-w-[1000px] border-collapse">
								<thead>
									<tr>
										<th class="text-left p-6 font-black text-gray-900 w-64 bg-gray-50 border-b-[3px] border-r-[3px] border-gray-900 sticky left-0 z-10">
											Feature
										</th>
										{#each comparisonPlans as planId (planId + '-' + showAnnual)}
											{@const isPopular = popularPlanNames.includes(PLAN_DISPLAY_NAMES[planId])}
											<th class="p-6 text-center border-b-[3px] border-r-[3px] last:border-r-0 border-gray-900 {isPopular ? 'bg-[#ffc480]/10' : 'bg-white'}">
												<span class="font-black text-lg text-gray-900 block uppercase tracking-wide">{PLAN_DISPLAY_NAMES[planId]}</span>
												<span class="text-sm font-bold text-gray-500 mt-1 block">
													{getPlanPrice(planId, showAnnual)}/mo
													{#if showAnnual && PLAN_PRICING[planId]?.monthly > 0}
														<span class="text-[#10b981] text-xs block">billed annually</span>
													{/if}
												</span>
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each featureComparisonRows as section}
										<tr>
											<td colspan={comparisonPlans.length + 1} class="p-4 bg-gray-900 text-white font-black text-sm uppercase tracking-widest border-b-[3px] border-gray-900">
												{section.category}
											</td>
										</tr>
										{#each section.features as row, rowIndex}
											<tr class="hover:bg-gray-50 transition-colors">
												<td class="p-5 text-gray-900 border-b border-r-[3px] last:border-b-0 border-gray-900 bg-white sticky left-0 z-10">
													<div class="flex flex-col">
														<span class="font-bold text-base">{row.label}</span>
														{#if row.description}
															<span class="text-xs text-gray-500 font-bold mt-1">{row.description}</span>
														{/if}
													</div>
												</td>
												{#each comparisonPlans as planId (planId + '-' + showAnnual)}
													{@const isPopular = popularPlanNames.includes(PLAN_DISPLAY_NAMES[planId])}
													{@const value = row.allPlans ? true : formatFeatureValue(planId, row.feature, row.unit || '')}
													<td class="p-5 text-center border-b border-r-[3px] last:border-r-0 last:border-b-0 border-gray-900 {isPopular ? 'bg-[#ffc480]/5' : ''}">
														{#if value === true}
															<div class="w-8 h-8 rounded-lg bg-[#a2ffc1] border-2 border-gray-900 flex items-center justify-center mx-auto shadow-[2px_2px_0_0_#1f2937]">
																<svg class="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
																	<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
																</svg>
															</div>
														{:else if value === false}
															<div class="w-8 h-8 rounded-lg bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto opacity-50">
																<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
																	<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
																</svg>
															</div>
														{:else}
															<span class="font-black text-gray-900 text-lg">{value}</span>
														{/if}
													</td>
												{/each}
											</tr>
										{/each}
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Enterprise CTA -->
				<div class="max-w-4xl mx-auto w-full relative overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-[#FFFDF8] p-10 md:p-16 shadow-[8px_8px_0_0_#1f2937] text-center z-10">
					<!-- Geometric Decorations -->
					<div class="absolute -top-10 -right-10 w-32 h-32 border-[4px] border-gray-900 rounded-full opacity-10"></div>
					<div class="absolute -bottom-10 -left-10 w-32 h-32 bg-gray-900 rounded-full opacity-5"></div>
					
					<div class="relative z-10 flex flex-col items-center gap-6">
						<h3 class="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">Enterprise Needs?</h3>
						<p class="text-xl text-gray-700 font-bold max-w-2xl mx-auto">
							For companies requiring custom SLAs, dedicated infrastructure, and priority support.
						</p>
						<a
							href="mailto:support@pictify.io"
							class="inline-flex items-center gap-3 mt-4 px-8 py-5 bg-gray-900 text-white font-black rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#ffc480] hover:bg-gray-800 transition-all text-lg uppercase tracking-widest"
						>
							<span>Contact Sales</span>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
						</a>
					</div>
				</div>

				<!-- FAQ Section -->
				<div class="flex flex-col gap-12 mt-8 max-w-5xl mx-auto w-full relative z-10">
					<div class="text-center max-w-2xl mx-auto">
						<h2 class="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Common Questions</h2>
						<p class="text-xl text-gray-700 font-bold">Everything you need to know about plans and billing.</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						{#each FAQs as faq}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div 
								class="group flex flex-col bg-white rounded-xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#1f2937] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#1f2937]"
								on:click={() => (faq.isOpened = !faq.isOpened)}
							>
								<div class="flex items-start justify-between gap-4 p-6">
									<h3 class="text-lg font-black text-gray-900 leading-tight pr-4">{faq.question}</h3>
									<div class="w-10 h-10 rounded-lg bg-gray-50 border-[2px] border-gray-900 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-[2px_2px_0_0_#1f2937] {faq.isOpened ? 'rotate-180 bg-[#ffc480]' : 'group-hover:translate-x-[1px] group-hover:translate-y-[1px]'}">
										<svg
											class="w-5 h-5 text-gray-900"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="3"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
										</svg>
									</div>
								</div>
								{#if faq.isOpened}
									<div class="px-6 pb-6 pt-0">
										<div class="h-[2px] w-full bg-gray-100 mb-4"></div>
										<p class="text-base text-gray-700 font-bold leading-relaxed">
											{@html faq.answer}
										</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</main>

	<Footer />
</section>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(-6deg); }
		50% { transform: translateY(-10px) rotate(-3deg); }
	}
	@keyframes float-reverse {
		0%, 100% { transform: translateY(0px) rotate(6deg); }
		50% { transform: translateY(-10px) rotate(3deg); }
	}
</style>
