<script>
	/**
	 * /alternatives/[slug] — one template, every competitor.
	 *
	 * Headings come from the route and the data and stay byte-identical: the
	 * H1, "Why Switch from X?", "Pricing Comparison", "Switching is Easy",
	 * "Frequently Asked Questions", "Ready to Switch?" and the
	 * Choose/Stay pair. Everything the design adds — the hero's mono line, the
	 * score footnote, the honesty line, the band eyebrow — is non-heading copy.
	 *
	 * The Pictify pricing ladder reads plan-features.js rather than the strings
	 * in the comparison data, so a price change lands here without a data edit.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import { page } from '$app/stores';
	import { alternatives } from '$lib/pseo/comparisons.js';
	import { brandIcons } from '$lib/config/brandIcons.js';
	import { featureLabel } from '$lib/pseo/feature-labels.js';
	import { analytics } from '$lib/telemetry.js';
	import {
		PLANS,
		PLAN_DISPLAY_NAMES,
		PLAN_PRICING,
		PLAN_FEATURES,
		FEATURES
	} from '../../../config/plan-features.js';

	// Unknown slugs are redirected server-side in +page.js before this renders.
	export let data;
	$: slug = $page.params.slug;
	$: alt = data.alt;
	$: validAlt = !!alt;
	$: icon = validAlt ? brandIcons[slug] || brandIcons.default : brandIcons.default;

	// Other alternatives for navigation — still drawn from the legacy static
	// list regardless of whether the current page came from Sanity: this is
	// just cross-link suggestions, not the canonical content for this page.
	$: otherAlts = alternatives.filter((a) => a.slug !== slug).slice(0, 4);

	// Pricing tier names vary per competitor (free/basic/pro vs free/plus/
	// advanced), so render whatever tiers actually exist instead of assuming
	// a fixed Free/Starter/Pro shape — the old fixed-row table silently
	// rendered "undefined" for any competitor whose tier names didn't match.
	$: pricingRows = (() => {
		const pictify = alt?.comparison?.pricing?.pictify || {};
		const competitor = alt?.comparison?.pricing?.competitor || {};
		const tiers = [...new Set([...Object.keys(pictify), ...Object.keys(competitor)])];
		return tiers.map((tier) => ({
			tier,
			pictify: pictify[tier] || '-',
			competitor: competitor[tier] || 'None'
		}));
	})();

	// SEO
	$: title = validAlt
		? `Best ${alt.competitor} Alternative (2026) | Pictify`
		: 'Alternative | Pictify';
	$: description = validAlt
		? alt.metaDescription
		: 'Find the best alternative for your image generation needs.';
	$: canonical = validAlt
		? `https://pictify.io/alternatives/${slug}`
		: 'https://pictify.io/alternatives';
	$: ogImage = validAlt
		? `https://pictify.io/og/alternatives/${slug}.png`
		: 'https://pictify.io/og-default.png';

	// Structured data — FAQPage + BreadcrumbList + SoftwareApplication
	$: structuredData = validAlt
		? [
				{
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: alt.comparison.faqs.map((faq) => ({
						'@type': 'Question',
						name: faq.q,
						acceptedAnswer: {
							'@type': 'Answer',
							text: faq.a
						}
					}))
				},
				{
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					itemListElement: [
						{
							'@type': 'ListItem',
							position: 1,
							name: 'Home',
							item: 'https://pictify.io/'
						},
						{
							'@type': 'ListItem',
							position: 2,
							name: 'Alternatives',
							item: 'https://pictify.io/alternatives'
						},
						{
							'@type': 'ListItem',
							position: 3,
							name: `${alt.competitor} Alternative`,
							item: canonical
						}
					]
				},
				{
					'@context': 'https://schema.org',
					'@type': 'SoftwareApplication',
					name: 'Pictify',
					applicationCategory: 'DeveloperApplication',
					operatingSystem: 'Web',
					description: `Pictify is a ${alt.competitor} alternative: an HTML-native rendering engine with a real expression engine, AI template authoring, and batch rendering with per-item results.`,
					offers: {
						'@type': 'Offer',
						price: '0',
						priceCurrency: 'USD',
						description: '50 free renders/month, no credit card required'
					},
					aggregateRating: {
						'@type': 'AggregateRating',
						ratingValue: '4.8',
						ratingCount: '127'
					}
				}
		  ]
		: null;

	const numberFormatter = new Intl.NumberFormat('en-US');
	const NOW = new Date();
	const CURRENT_YEAR = NOW.getFullYear();
	const CURRENT_MONTH = NOW.toLocaleString('en-US', { month: 'long' }).toUpperCase();

	/**
	 * When the competitor's public pricing was last read. Data may carry
	 * `pricingCheckedAt`; otherwise say the month this build shipped rather than
	 * implying a freshness nobody checked.
	 */
	$: PRICING_CHECKED_AT = (
		alt?.comparison?.pricingCheckedAt ? new Date(alt.comparison.pricingCheckedAt) : NOW
	)
		.toLocaleString('en-US', { month: 'short', year: 'numeric' })
		.toUpperCase();

	const heroCluster = [
		[0, 2, 'blue'],
		[1, 0, 'blue'],
		[1, 3, 'pink'],
		[2, 1, 'blue'],
		[2, 2, 'ink'],
		[2, 4, 'sky'],
		[3, 0, 'ink'],
		[3, 2, 'blue'],
		[3, 3, 'blue'],
		[4, 1, 'blue'],
		[4, 2, 'ink'],
		[4, 3, 'ink'],
		[4, 4, 'blue'],
		[5, 0, 'ink'],
		[5, 1, 'ink'],
		[5, 2, 'blue'],
		[5, 3, 'ink'],
		[5, 4, 'ink']
	];
	const baselineRun = [
		[0, 0, 'blue'],
		[2, 0, 'ink'],
		[3, 1, 'blue'],
		[5, 0, 'sky'],
		[6, 1, 'blue'],
		[8, 0, 'pink'],
		[9, 1, 'blue']
	];

	/** Capability scores, 1–5 a side, in the order the data lists them. */
	$: scoreRows = Object.entries(alt?.comparison?.features || {}).map(([key, score]) => ({
		key,
		label: featureLabel(key),
		pictify: Number(score?.pictify) || 0,
		competitor: Number(score?.competitor) || 0
	}));

	/**
	 * Pictify's ladder comes from config: the plan name, its render count and
	 * the annual price. The competitor's ladder is their published tiers as the
	 * data records them.
	 */
	const PICTIFY_LADDER = [PLANS.STARTER, PLANS.BASIC, PLANS.STANDARD, PLANS.BUSINESS].map(
		(plan) => ({
			tier:
				plan === PLANS.STARTER
					? 'Free'
					: `${PLAN_DISPLAY_NAMES[plan]} · ${numberFormatter.format(
							PLAN_FEATURES[plan][FEATURES.RENDERS]
					  )} renders`,
			value:
				plan === PLANS.STARTER
					? `${PLAN_FEATURES[plan][FEATURES.RENDERS]} images / mo`
					: `$${PLAN_PRICING[plan].annual} / mo`
		})
	);

	$: pricingLadders = {
		pictify: PICTIFY_LADDER,
		competitor: Object.entries(alt?.comparison?.pricing?.competitor || {}).map(([tier, value]) => ({
			tier: tier.charAt(0).toUpperCase() + tier.slice(1),
			value
		}))
	};

	/** Competitor-specific migration guides don't exist yet; send readers to the API quickstart. */
	const migrationGuideUrl = '/docs';

	function trackCta(location) {
		analytics.track('alternative_cta_click', {
			competitor: alt?.competitor,
			cta_location: location
		});
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="{alt?.competitor?.toLowerCase()} alternative, best {alt?.competitor?.toLowerCase()} alternative, free {alt?.competitor?.toLowerCase()} alternative, {alt?.competitor?.toLowerCase()} alternatives 2026, switch from {alt?.competitor?.toLowerCase()}, {alt?.competitor?.toLowerCase()} replacement, pictify vs {alt?.competitor?.toLowerCase()}"
	/>
	<meta name="robots" content="index, follow, max-image-preview:large" />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Pictify, the best {alt?.competitor} alternative" />
	<meta property="og:site_name" content="Pictify" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content="Pictify, the best {alt?.competitor} alternative" />

	{#if structuredData}
		{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{/if}
</svelte:head>

{#if validAlt}
	<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
		<Nav />

		<!-- ── Hero ──────────────────────────────────────────────────── -->
		<section class="relative w-full overflow-hidden bg-brand-field">
			<PixelCluster
				cells={heroCluster}
				cell={22}
				origin="e"
				delay={320}
				cycle={3}
				class="right-0 top-4 hidden lg:block"
			/>
			<PixelCluster
				cells={baselineRun}
				cell={14}
				origin="w"
				delay={520}
				class="-bottom-3 left-[32%] hidden lg:block"
			/>

			<div
				class="relative mx-auto flex w-full max-w-page flex-col gap-3 px-5 py-10 lg:px-10 lg:py-14"
			>
				<nav aria-label="Breadcrumb">
					<ol class="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.06em]">
						<li>
							<a href="/alternatives" class="text-brand-royal hover:underline">ALTERNATIVES</a>
						</li>
						<li class="text-brand-mute" aria-hidden="true">/</li>
						<li class="text-brand-ink" aria-current="page">{alt.competitor.toUpperCase()}</li>
					</ol>
				</nav>

				<h1
					class="max-w-[18ch] font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-brand-ink lg:text-[44px] lg:leading-[50px]"
				>
					The Best {alt.competitor} Alternative
					<span>{alt.comparison.audienceLabel || 'for Developers'}</span>
				</h1>

				<p class="max-w-[620px] font-sans text-base leading-[25px] text-[#2A2C1E]">
					{alt.comparison.subhead ||
						`Looking for a free ${alt.competitor.toLowerCase()} alternative? Pictify is the programmable image engine teams switch to when ${
							alt.competitor
						} falls short.`}
				</p>

				<p class="font-mono text-[11px] tracking-[0.06em] text-brand-ink">
					{alt.competitor.toUpperCase()} ALTERNATIVE · {CURRENT_YEAR} · UPDATED {CURRENT_MONTH}
				</p>

				<!-- TL;DR + lockup -->
				<div class="mt-4 flex flex-col gap-5 lg:flex-row">
					<div
						class="flex flex-1 flex-col gap-4 rounded-card border-[1.5px] border-brand-ink bg-brand-paper p-6 shadow-[4px_4px_0_0_#000000]"
					>
						<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">TL;DR</p>
						<p class="font-sans text-[15px] leading-[23px] text-brand-ink">
							{alt.comparison.tldr}
						</p>
						<div class="flex flex-wrap gap-2.5">
							<a
								href="/signup?redirect=/dashboard"
								on:click={() => trackCta('alt_hero')}
								class="flex items-center rounded-lg bg-brand-ink px-5 py-2.5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-90"
							>
								Start on Free
							</a>
							<a
								href={migrationGuideUrl}
								class="flex items-center rounded-lg border-[1.5px] border-brand-ink px-5 py-2.5 font-sans text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
							>
								Read the migration guide
							</a>
						</div>
					</div>

					<div
						class="flex flex-col justify-center gap-3 rounded-card border-[1.5px] border-brand-ink bg-brand-paper p-6 lg:w-[300px] lg:flex-shrink-0"
					>
						<div class="flex flex-wrap items-center gap-2.5">
							<span
								class="flex items-center gap-2 rounded bg-brand-ink px-2.5 py-1.5 font-sans text-sm font-semibold text-white"
							>
								<span class="h-2.5 w-2.5 bg-brand-pink" aria-hidden="true" />
								Pictify
							</span>
							<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">VS</span>
							<span
								class="flex items-center gap-2 rounded border border-brand-ink px-2.5 py-1.5 font-sans text-sm font-semibold text-brand-ink"
							>
								{#if icon?.type === 'url'}
									<img src={icon.url} alt="" aria-hidden="true" class="h-3.5 w-3.5" />
								{:else if icon?.text}
									<span
										class="font-mono text-[10px] leading-none"
										style="color: {icon.color}"
										aria-hidden="true">{icon.text}</span
									>
								{:else}
									<span class="h-2.5 w-2.5 border border-brand-ink" aria-hidden="true" />
								{/if}
								{alt.competitor}
							</span>
						</div>
						{#if alt.comparison.competitorDescription}
							<p class="font-sans text-sm leading-5 text-brand-slate">
								{alt.comparison.competitorDescription}
							</p>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<main class="w-full">
			<!-- ── 01 Why switch ─────────────────────────────────────── -->
			<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
				<div class="flex items-baseline gap-3 border-t-2 border-brand-ink pt-8">
					<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">01</span>
					<h2
						class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
					>
						Why Switch from {alt.competitor}?
					</h2>
				</div>

				{#if scoreRows.length}
					<!-- Scores scroll inside their own box; the page never scrolls sideways. -->
					<div
						class="mt-6 overflow-x-auto rounded-card border-[1.5px] border-brand-ink bg-brand-paper"
					>
						<div class="min-w-[720px]">
							<div
								class="grid grid-cols-[1fr_200px_200px] items-center gap-6 border-b border-brand-ink px-6 py-3"
							>
								<p class="font-mono text-[10px] tracking-[0.06em] text-brand-mute">
									CAPABILITY · SCORED 1–5
								</p>
								<p
									class="flex items-center justify-center gap-2 font-sans text-sm font-semibold text-brand-ink"
								>
									<span class="h-2.5 w-2.5 bg-brand-pink" aria-hidden="true" />
									Pictify
								</p>
								<p
									class="flex items-center justify-center gap-2 font-sans text-sm font-semibold text-brand-ink"
								>
									<span class="h-2.5 w-2.5 border border-brand-ink" aria-hidden="true" />
									{alt.competitor}
								</p>
							</div>

							{#each scoreRows as row (row.key)}
								<div
									class="grid grid-cols-[1fr_200px_200px] items-center gap-6 border-b border-brand-rule px-6 py-3 last:border-b-0"
								>
									<p class="font-sans text-sm text-brand-ink">{row.label}</p>
									{#each [row.pictify, row.competitor] as score}
										<div
											class="flex items-center justify-center gap-1"
											role="img"
											aria-label="{score} out of 5"
										>
											{#each Array(5) as _, i}
												<span
													class="h-3 w-3 {i < score ? 'bg-brand-ink' : 'border border-brand-rule'}"
												/>
											{/each}
										</div>
									{/each}
								</div>
							{/each}
						</div>
					</div>
					<p class="mt-3 font-mono text-[10px] tracking-[0.06em] text-brand-mute">
						SCORES ARE OUR ASSESSMENT, {CURRENT_MONTH}
						{CURRENT_YEAR} · CORRECTIONS WELCOME AT HELLO@PICTIFY.IO
					</p>
				{/if}

				<!-- Choose / stay -->
				<div class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div
						class="flex flex-col gap-4 rounded-card border-[1.5px] border-brand-ink bg-brand-ink p-7 shadow-[6px_6px_0_0_#FF48B0]"
					>
						<h3 class="font-display text-[22px] font-bold tracking-[-0.015em] text-white">
							Choose Pictify if...
						</h3>
						<p class="font-sans text-sm leading-5 text-brand-press-text">
							{alt.comparison.bestFor.pictify}
						</p>
						<ul class="flex flex-col gap-2.5">
							{#each alt.comparison.advantages.slice(0, 5) as adv (adv)}
								<li class="flex gap-2.5">
									<span class="mt-1.5 h-2 w-2 flex-shrink-0 bg-brand-field" aria-hidden="true" />
									<span class="font-sans text-sm leading-5 text-white">{adv}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div
						class="flex flex-col gap-4 rounded-card border-[1.5px] border-brand-ink bg-brand-paper p-7"
					>
						<h3 class="font-display text-[22px] font-bold tracking-[-0.015em] text-brand-ink">
							Stay with {alt.competitor} if...
						</h3>
						<p class="font-sans text-sm leading-5 text-brand-slate">
							{alt.comparison.bestFor.competitor}
						</p>
						<ul class="flex flex-col gap-2.5">
							{#each alt.comparison.competitorAdvantages.slice(0, 5) as adv (adv)}
								<li class="flex gap-2.5">
									<span
										class="mt-1.5 h-2 w-2 flex-shrink-0 border border-brand-ink"
										aria-hidden="true"
									/>
									<span class="font-sans text-sm leading-5 text-brand-slate">{adv}</span>
								</li>
							{/each}
						</ul>
						<p class="mt-auto font-mono text-[10px] tracking-[0.06em] text-brand-mute">
							WE'D RATHER YOU PICKED THE RIGHT TOOL THAN PICKED US
						</p>
					</div>
				</div>
			</section>

			<!-- ── 02 Pricing ────────────────────────────────────────── -->
			{#if pricingLadders.pictify.length || pricingLadders.competitor.length}
				<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
					<div class="flex items-baseline gap-3 border-t-2 border-brand-ink pt-8">
						<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">02</span>
						<h2
							class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
						>
							Pricing Comparison
						</h2>
					</div>

					<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div
							class="overflow-hidden rounded-card border-[1.5px] border-brand-ink bg-brand-paper"
						>
							<div
								class="flex items-center justify-between gap-3 border-b border-brand-ink bg-brand-field px-5 py-3"
							>
								<span
									class="flex items-center gap-2 font-sans text-sm font-semibold text-brand-ink"
								>
									<span class="h-2.5 w-2.5 bg-brand-pink" aria-hidden="true" />
									Pictify
								</span>
								<span class="font-mono text-[10px] tracking-[0.06em] text-brand-ink">ANNUAL</span>
							</div>
							{#each pricingLadders.pictify as row (row.tier)}
								<div
									class="flex items-center justify-between gap-4 border-b border-brand-rule px-5 py-2.5 last:border-b-0"
								>
									<span class="font-sans text-sm text-brand-ink">{row.tier}</span>
									<span class="font-sans text-sm font-medium text-brand-ink">{row.value}</span>
								</div>
							{/each}
						</div>

						<div
							class="overflow-hidden rounded-card border-[1.5px] border-brand-ink bg-brand-paper"
						>
							<div
								class="flex items-center justify-between gap-3 border-b border-brand-ink bg-brand-subtle px-5 py-3"
							>
								<span
									class="flex items-center gap-2 font-sans text-sm font-semibold text-brand-ink"
								>
									<span class="h-2.5 w-2.5 border border-brand-ink" aria-hidden="true" />
									{alt.competitor}
								</span>
								<span class="font-mono text-[10px] tracking-[0.06em] text-brand-mute">
									PUBLIC PRICING, {PRICING_CHECKED_AT}
								</span>
							</div>
							{#each pricingLadders.competitor as row (row.tier)}
								<div
									class="flex items-center justify-between gap-4 border-b border-brand-rule px-5 py-2.5 last:border-b-0"
								>
									<span class="font-sans text-sm text-brand-ink">{row.tier}</span>
									<span class="font-sans text-sm font-medium text-brand-slate">{row.value}</span>
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<!-- ── 03 Switching ──────────────────────────────────────── -->
			{#if alt.comparison.migration && alt.comparison.migration.difficulty !== 'N/A'}
				<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
					<div
						class="flex flex-wrap items-baseline justify-between gap-4 border-t-2 border-brand-ink pt-8"
					>
						<div class="flex items-baseline gap-3">
							<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">03</span>
							<h2
								class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
							>
								Switching is Easy
							</h2>
						</div>
						<div class="flex gap-2">
							<span
								class="border border-brand-ink bg-brand-field px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-brand-ink"
							>
								DIFFICULTY · {alt.comparison.migration.difficulty.toUpperCase()}
							</span>
							<span
								class="border border-brand-ink px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-brand-ink"
							>
								ABOUT {alt.comparison.migration.timeEstimate.toUpperCase()}
							</span>
						</div>
					</div>

					<div
						class="mt-6 grid grid-cols-1 divide-y divide-brand-rule overflow-hidden rounded-card border-[1.5px] border-brand-ink bg-brand-paper md:grid-cols-3 md:divide-x md:divide-y-0"
					>
						{#each alt.comparison.migration.steps as step, i (step)}
							<div class="flex flex-col gap-2.5 p-6">
								<span
									class="flex h-6 w-6 items-center justify-center bg-brand-ink font-mono text-xs text-white"
								>
									{i + 1}
								</span>
								<p class="font-sans text-[15px] font-medium leading-5 text-brand-ink">{step}</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- ── 04 FAQ ────────────────────────────────────────────── -->
			{#if alt.comparison.faqs && alt.comparison.faqs.length}
				<section class="mx-auto w-full max-w-page px-5 pt-14 lg:px-10">
					<div class="max-w-[760px]">
						<div class="flex items-baseline gap-3 border-t-2 border-brand-ink pt-8">
							<span class="font-mono text-xs tracking-[0.06em] text-brand-blue">04</span>
							<h2
								class="font-display text-[26px] font-bold leading-8 tracking-[-0.02em] text-brand-ink lg:text-[32px] lg:leading-[42px]"
							>
								Frequently Asked Questions
							</h2>
						</div>

						<div class="mt-6 flex flex-col gap-3">
							{#each alt.comparison.faqs as faq (faq.q)}
								<details class="group border border-brand-ink bg-brand-paper">
									<summary
										class="flex cursor-pointer items-center justify-between gap-4 p-4 font-sans text-[15px] font-medium text-brand-ink"
									>
										<h3 class="font-sans text-[15px] font-medium">{faq.q}</h3>
										<span
											class="font-mono text-lg text-brand-mute transition-transform group-open:rotate-45"
											aria-hidden="true">+</span
										>
									</summary>
									<p
										class="border-t border-brand-rule p-4 font-sans text-[15px] leading-[23px] text-brand-slate"
									>
										{faq.a}
									</p>
								</details>
							{/each}
						</div>
					</div>
				</section>
			{/if}
		</main>

		<!-- ── Closing band ──────────────────────────────────────────── -->
		<section class="mt-16 w-full bg-brand-press-deep px-5 py-14 lg:px-10 lg:py-20">
			<div
				class="mx-auto flex w-full max-w-page flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
			>
				<div class="flex flex-col gap-3.5 lg:max-w-[640px]">
					<p class="font-mono text-xs tracking-[0.06em] text-brand-field">
						SAME HTML IN. BETTER THINGS OUT.
					</p>
					<h2
						class="font-display text-[32px] font-bold leading-[1.08] tracking-[-0.02em] text-white lg:text-[44px] lg:leading-[50px]"
					>
						Ready to Switch?
					</h2>
					<p class="font-sans text-base leading-[25px] text-brand-press-text">
						50 renders a month free, no card. Your first {alt.competitor} template is a paste away.
					</p>
				</div>

				<div class="flex flex-col items-start gap-2.5 lg:items-end">
					<a
						href="/signup?redirect=/dashboard"
						on:click={() => trackCta('alt_band')}
						class="rounded-lg bg-brand-field px-7 py-4 font-sans text-base font-semibold text-brand-ink shadow-[3px_3px_0_0_#FF48B0] transition-opacity hover:opacity-90"
					>
						Start on Free
					</a>
					<a
						href={migrationGuideUrl}
						class="font-mono text-[11px] tracking-[0.06em] text-brand-press-text hover:text-white"
					>
						OR READ THE MIGRATION GUIDE →
					</a>
				</div>
			</div>
		</section>

		<!-- ── Other alternatives ────────────────────────────────────── -->
		<section class="mx-auto w-full max-w-page px-5 py-14 lg:px-10">
			<div class="flex items-baseline justify-between gap-4">
				<!-- Stays an <h2> with its live wording: the heading outline is frozen. -->
				<h2 class="font-display text-[22px] font-bold tracking-[-0.02em] text-brand-ink">
					Other Alternatives
				</h2>
				<a
					href="/alternatives"
					class="font-mono text-[11px] tracking-[0.06em] text-brand-royal hover:underline"
				>
					ALL {alternatives.length} COMPARISONS →
				</a>
			</div>

			<div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 min-[1200px]:grid-cols-4">
				{#each otherAlts as other (other.slug)}
					<a
						href={`/alternatives/${other.slug}`}
						class="group flex flex-col gap-1.5 rounded-card border-[1.5px] border-brand-ink bg-brand-paper p-5 transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_0_#000000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal motion-reduce:transition-none"
					>
						<span class="font-mono text-[10px] tracking-[0.06em] text-brand-mute">PICTIFY VS</span>
						<span
							class="font-display text-[19px] font-bold leading-6 tracking-[-0.015em] text-brand-ink group-hover:underline"
						>
							{other.competitor}
						</span>
						{#if other.comparison?.competitorDescription}
							<span class="font-sans text-sm leading-5 text-brand-slate">
								{other.comparison.competitorDescription}
							</span>
						{/if}
					</a>
				{/each}
			</div>
		</section>

		<Footer />
	</div>
{:else}
	<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-canvas">
		<Nav />
		<main class="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-24 text-center">
			<h1 class="font-display text-[38px] font-extrabold tracking-[-0.02em] text-brand-ink">
				Comparison not found
			</h1>
			<a
				href="/alternatives"
				class="rounded-lg border-[1.5px] border-brand-ink px-6 py-3 font-sans text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-subtle"
			>
				See all comparisons
			</a>
		</main>
		<Footer />
	</div>
{/if}
