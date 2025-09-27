<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { getProducts } from '../../api/product';
import { onMount, onDestroy } from 'svelte';
import { user } from '../../store/user.store';
import { goto } from '$app/navigation';

let plans = [];
let selectedPlanIndex = 0;
let didManuallySelect = false;
let requestsNeeded = 1500;
let maxRequests = 0;
let minRequests = 0;
let recommendedPlanIndex = 0;
let selectedPlan = null;
let sliderIndex = 0;

const numberFormatter = new Intl.NumberFormat('en-US');
const popularPlanNames = ['Basic', 'Professional', 'Business'];

const FAQs = [
	{
		question: 'What happens if I exceed the monthly limit?',
		answer:
			'If you exceed your request limit, you can either upgrade to a higher plan or purchase additional requests at a discounted rate.',
		isOpened: false
	},
	{
		question: 'Can I change my plan later?',
		answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings.',
		isOpened: false
	},
	{
		question: 'Can I pay annually?',
		answer:
			"Yes, please contact us at <a href='mailto:support@pictify.io'>support@pictify.io</a> for annual payment options.",
		isOpened: false
	},
	{
		question: 'Do you offer custom plans?',
		answer:
			"Yes, we offer custom plans for high-volume users. Please contact us at <a href='mailto:support@pictify.io'>support@pictify.io</a> for more information.",
		isOpened: false
	},
	{
		question: 'How to debug issues with the API?',
		answer:
			"If you are facing issues with the API, please check the API documentation or contact us at <a href='mailto:mailto:support@pictify.io'>support@pictify.io</a> for assistance. We will respond to your queries within 48 hours.",
		isOpened: false
	}
];

let isLoggedIn = false;
let unsubscribe = () => {};

onMount(async () => {
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

const selectPlanHandler = (planIndex = selectedPlanIndex) => {
	const plan = plans[planIndex];
	if (!plan) return;
	if (!isLoggedIn) {
		goto(`/signup?redirect=${plan.purchase_url ?? '/dashboard/api-token'}`);
		return;
	}
	if (plan.purchase_url) {
		window.location.href = plan.purchase_url;
	} else {
		window.location.href = '/dashboard/api-token';
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
	selectPlanHandler(index);
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

<section>
	<Nav />
	<main>
		<div class="relative overflow-hidden">
			<div class="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#ffc480]/30 blur-2xl"></div>
			<div class="pointer-events-none absolute -left-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#c6e0ff]/40 blur-3xl"></div>
			<div class="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 md:px-10">
				<div class="flex flex-col gap-6 text-left md:max-w-3xl">
					<h1 class="text-4xl font-bold md:text-5xl">Find the plan made for your volume</h1>
					<p class="text-lg text-gray-600 md:text-xl">
						Move the slider to estimate your usage and we’ll highlight the plan that keeps your workflows fast without wasting budget.
					</p>
				</div>

				{#if plans.length}
					<div class="flex flex-col gap-12">
						<div class="w-full rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
							<div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
								<div class="flex flex-col gap-4 lg:w-1/2">
									<div class="flex flex-col items-start gap-1">
										<p class="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Estimated usage</p>
										<h2 class="text-2xl font-semibold text-gray-900">{formatRequests(requestsNeeded)}</h2>
										<button
											class="text-xs font-medium text-gray-500 underline-offset-4 hover:underline disabled:opacity-40"
											on:click={resetToRecommendation}
											disabled={!didManuallySelect}
										>
											Reset to recommended
										</button>
									</div>
									<div class="flex flex-col gap-4">
										<label class="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500" for="requests-slider">
											Update estimate
										</label>
									<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
										<input
											id="requests-slider"
											type="range"
											min="0"
											max={plans.length ? plans.length - 1 : 0}
											step="1"
											value={sliderIndex}
											class="h-1.5 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#ffc480] to-[#1f2937]"
											on:input={(event) => handleSliderChange(event.target.value)}
										/>
										<div class="flex flex-col gap-2 lg:w-auto">
											<label class="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500" for="requests-input">
												Requests needed
											</label>
											<input
												id="requests-input"
												type="number"
												class="w-full rounded-lg border border-gray-200 px-3 py-2 text-right text-base font-semibold text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none lg:w-36"
												bind:value={requestsNeeded}
												on:input={(event) => handleRequestsChange(ensureNumber(event.target.value))}
												step={sliderStep}
												min={minRequests}
												max={maxRequests}
											/>
										</div>
									</div>
									</div>
								</div>

								<div class="flex flex-col gap-4 border-t border-gray-100 pt-4 lg:w-[45%] lg:border-t-0 lg:border-l lg:border-gray-100 lg:pl-6 lg:pt-0">
									<p class="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
										Recommended plan
									</p>
									{#if selectedPlan}
										<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start lg:gap-3">
											<div class="flex flex-col gap-1">
												<div class="flex items-center gap-2">
													<h3 class="text-xl font-semibold text-gray-900">{selectedPlan.name}</h3>
													{#if popularPlanNames.includes(selectedPlan.name)}
														<span class="rounded-full bg-[#ffc480]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-900">
															Most popular
														</span>
													{/if}
												</div>
												<p class="text-sm text-gray-600">{formatRequests(selectedPlan.request_per_month)}</p>
											</div>
											<div class="flex flex-col items-start gap-2 sm:items-end lg:items-start">
												<p class="text-2xl font-semibold text-gray-900">{selectedPlan.price_formatted}</p>
												<button
													class="inline-flex items-center justify-center rounded-full border border-gray-900 bg-[#ffc480] px-5 py-1.5 text-sm font-semibold text-gray-900 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#1f293780]"
													on:click={() => selectPlanHandler(selectedPlanIndex)}
												>
													Choose {selectedPlan.name}
												</button>
											</div>
										</div>
									{:else}
										<p class="text-sm text-gray-600">We’ll guide you to the right plan as soon as pricing is available.</p>
									{/if}
								</div>
							</div>
						</div>

						<div class="flex flex-col gap-6">
							<div class="flex items-center justify-between">
								<h2 class="text-2xl font-semibold">Compare plans</h2>
								<div class="text-sm text-gray-500">Scroll for more tiers</div>
							</div>
							<div class="grid gap-5 overflow-x-auto rounded-3xl border-[3px] border-gray-900 bg-white p-6 shadow-[8px_8px_0_0_#1f293780]">
							<div class="min-w-[780px]">
								<div class="grid grid-cols-[1.4fr_repeat(3,1fr)] items-center gap-4 border-b border-gray-200 pb-4 text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
										<span>Plan</span>
										<span class="text-center">Monthly</span>
										<span class="text-center">Requests</span>
									<span class="text-center">Purchase</span>
									</div>
									<div class="mt-4 flex flex-col divide-y divide-gray-100">
										{#each plans as plan, index}
											<div
												tabindex="0"
												role="button"
											class={`grid grid-cols-[1.4fr_repeat(3,1fr)] items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 cursor-pointer ${
													selectedPlanIndex === index
														? 'border border-gray-300 bg-[#f3f6ff] shadow-[4px_4px_0_0_#1f293780]'
														: 'hover:bg-[#fafafa]'
												}`}
												on:click={() => handlePlanClick(index)}
												on:keydown={(event) => handleRowKeyDown(event, index)}
											aria-pressed={selectedPlanIndex === index}
											>
												<span class="flex flex-col gap-1">
													<span class="text-lg font-semibold">{plan.name}</span>
													{#if popularPlanNames.includes(plan.name)}
														<span class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Popular choice</span>
													{/if}
												</span>
												<span class="text-center text-base font-semibold">{plan.price_formatted}</span>
												<span class="text-center text-sm font-medium text-gray-600">{formatRequestsShort(plan.request_per_month)}</span>
												<span class="flex justify-center">
													<button
														class="inline-flex items-center justify-center rounded-full border border-gray-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-900 transition-colors hover:bg-[#ffc480]/70"
														on:click={(event) => purchasePlan(event, index)}
													>
														Buy now
													</button>
												</span>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="rounded-3xl border-[3px] border-dashed border-gray-300 bg-white/70 p-10 text-center text-gray-500 shadow-[8px_8px_0_0_#1f293780]">
						<p>Loading pricing tiers…</p>
					</div>
				{/if}

				<div class="flex flex-col gap-10">
					<div class="flex flex-col gap-2">
						<h2 class="text-3xl font-semibold">Frequently asked</h2>
						<p class="text-base text-gray-600">
							Answers to common questions about billing, usage, and switching between plans.
						</p>
					</div>
				<div class="flex flex-col gap-4">
						{#each FAQs as faq}
							<div class="group rounded-2xl border-[3px] border-gray-900 bg-white p-6 shadow-[6px_6px_0_0_#1f293780] transition-transform hover:-translate-y-0.5">
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div class="flex w-full cursor-pointer items-start justify-between gap-3" on:click={() => (faq.isOpened = !faq.isOpened)}>
									<h3 class="text-lg font-semibold text-gray-900">{faq.question}</h3>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class={`h-6 w-6 transition-transform ${faq.isOpened ? 'rotate-180' : ''}`}
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
									</svg>
								</div>
								{#if faq.isOpened}
									<p class="mt-3 text-base text-gray-600">
										{@html faq.answer}
									</p>
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
