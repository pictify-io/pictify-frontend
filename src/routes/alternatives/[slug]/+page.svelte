<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { alternatives } from '$lib/pseo/comparisons.js';
	import { brandIcons } from '$lib/config/brandIcons.js';

	$: slug = $page.params.slug;
	$: alt = alternatives.find((a) => a.slug === slug);
	$: validAlt = !!alt;
	$: icon = validAlt ? brandIcons[slug] || brandIcons.default : brandIcons.default;

	// Redirect if not found
	$: if (browser && !validAlt && slug) {
		goto('/alternatives');
	}

	// Other alternatives for navigation
	$: otherAlts = alternatives.filter((a) => a.slug !== slug).slice(0, 4);

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
					description: `Pictify is a ${alt.competitor} alternative — a programmable image engine with a real expression engine, live data bindings, and native A/B experiments.`,
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
	<meta property="og:image:alt" content="Pictify — the best {alt?.competitor} alternative" />
	<meta property="og:site_name" content="Pictify" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content="Pictify — the best {alt?.competitor} alternative" />

	{#if structuredData}
		{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{/if}
</svelte:head>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-hidden font-['Manrope']">
	<Nav />

	<!-- Background Elements -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#4ade80]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>

	<main
		class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10"
	>
		{#if validAlt}
			<!-- Breadcrumb -->
			<nav class="mb-8">
				<ol class="flex items-center gap-2 text-sm font-bold">
					<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
					<li class="text-gray-400">/</li>
					<li>
						<a href="/alternatives" class="text-gray-500 hover:text-gray-900">Alternatives</a>
					</li>
					<li class="text-gray-400">/</li>
					<li class="text-gray-900">{alt.competitor}</li>
				</ol>
			</nav>

			<!-- Hero Section -->
			<div
				class="relative flex flex-col items-center justify-center text-center mb-12 pt-4 sm:pt-8"
			>
				<!-- Badge -->
				<div
					class="inline-flex transform -rotate-1 hover:rotate-0 transition-transform duration-300 cursor-default mb-6"
				>
					<div
						class="px-5 py-2 bg-[#4ade80] border-[3px] border-gray-900 text-gray-900 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] rounded-lg"
					>
						{alt.competitor} Alternative · 2026
					</div>
				</div>

				<!-- Title: primary keyword "{Competitor} alternative" in <h1>. -->
				<h1
					class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-4"
				>
					The Best {alt.competitor} Alternative
					<span class="block text-[#4ade80]">for Developers</span>
				</h1>

				<!-- Supporting subhead: repeats the keyword + adds long-tail variants. -->
				<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed max-w-2xl mb-6">
					Looking for a free {alt.competitor.toLowerCase()} alternative? Pictify is the programmable image engine
					teams switch to when {alt.competitor} falls short.
				</p>

				<!-- TL;DR -->
				<div
					class="bg-white border-[3px] border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_0_#ffc480] max-w-3xl"
				>
					<p class="text-gray-700 font-bold leading-relaxed">
						<span class="text-[#ff6b6b] font-black">TL;DR:</span>
						{alt.comparison.tldr}
					</p>
				</div>
			</div>

			<!-- Why Switch Section -->
			<section class="mb-12">
				<h2 class="text-2xl font-black text-gray-900 mb-6">Why Switch from {alt.competitor}?</h2>
				<div class="grid md:grid-cols-2 gap-4">
					{#each alt.comparison.advantages as advantage, i}
						<div
							class="flex items-start gap-3 bg-white border-[2px] border-gray-200 rounded-xl p-4"
						>
							<div
								class="w-8 h-8 bg-[#4ade80] border-[2px] border-gray-900 rounded-lg flex items-center justify-center font-black text-gray-900 text-sm flex-shrink-0"
							>
								{i + 1}
							</div>
							<span class="text-gray-800 font-medium">{advantage}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- Comparison Cards -->
			<section class="grid md:grid-cols-2 gap-6 mb-12">
				<!-- Pictify Card -->
				<div
					class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_0_#4ade80]"
				>
					<div class="flex items-center gap-4 mb-6">
						<div
							class="w-14 h-14 bg-gray-900 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0_0_#ffc480]"
						>
							<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<h3 class="text-2xl font-black text-gray-900">Choose Pictify if...</h3>
					</div>
					<p class="text-gray-700 font-medium mb-6 leading-relaxed">
						{alt.comparison.bestFor.pictify}
					</p>
					<ul class="space-y-3">
						{#each alt.comparison.advantages.slice(0, 4) as adv}
							<li class="flex items-start gap-3">
								<div
									class="w-6 h-6 rounded-full bg-[#4ade80] border-[2px] border-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5"
								>
									<svg
										class="w-3 h-3 text-gray-900 font-bold"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="4"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<span class="text-gray-900 font-bold">{adv}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Competitor Card -->
				<div class="bg-gray-50 border-[3px] border-dashed border-gray-400 rounded-2xl p-8">
					<div class="flex items-center gap-4 mb-6">
						<div
							class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0_0_#9ca3af]"
							style="color: {icon.color || '#1f2937'}"
						>
							{#if icon.type === 'url'}
								<img src={icon.url} alt={alt.competitor} class="w-8 h-8" />
							{:else if icon.type === 'text'}
								<span class="text-lg font-black" style="color: {icon.color}">{icon.text}</span>
							{:else if icon.type === 'svg'}
								<svg class="w-8 h-8" fill="currentColor" viewBox={icon.viewBox}>
									<path d={icon.path} />
								</svg>
							{:else}
								<span class="text-xl font-black text-gray-600">{alt.competitor.charAt(0)}</span>
							{/if}
						</div>
						<h3 class="text-2xl font-black text-gray-500">Stay with {alt.competitor} if...</h3>
					</div>
					<p class="text-gray-500 font-medium mb-6 leading-relaxed">
						{alt.comparison.bestFor.competitor}
					</p>
					<ul class="space-y-3">
						{#each alt.comparison.competitorAdvantages.slice(0, 4) as adv}
							<li class="flex items-start gap-3">
								<div
									class="w-6 h-6 rounded-full bg-gray-200 border-[2px] border-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5"
								>
									<svg
										class="w-3 h-3 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="4"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<span class="text-gray-500 font-medium">{adv}</span>
							</li>
						{/each}
					</ul>
				</div>
			</section>

			<!-- Pricing Comparison -->
			{#if alt.comparison.pricing}
				<section class="mb-12">
					<h2 class="text-2xl font-black text-gray-900 mb-6">Pricing Comparison</h2>
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]"
					>
						<table class="w-full">
							<thead class="bg-gray-900 text-white">
								<tr>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm"
										>Plan</th
									>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm"
										>Pictify</th
									>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm"
										>{alt.competitor}</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								<tr>
									<td class="px-6 py-4 font-bold text-gray-900">Free</td>
									<td class="px-6 py-4 font-medium text-[#4ade80]"
										>{alt.comparison.pricing.pictify.free}</td
									>
									<td class="px-6 py-4 font-medium text-gray-600"
										>{alt.comparison.pricing.competitor.free || 'None'}</td
									>
								</tr>
								<tr class="bg-gray-50">
									<td class="px-6 py-4 font-bold text-gray-900">Starter</td>
									<td class="px-6 py-4 font-medium text-[#4ade80]"
										>{alt.comparison.pricing.pictify.starter}</td
									>
									<td class="px-6 py-4 font-medium text-gray-600"
										>{alt.comparison.pricing.competitor.starter}</td
									>
								</tr>
								<tr>
									<td class="px-6 py-4 font-bold text-gray-900">Pro</td>
									<td class="px-6 py-4 font-medium text-[#4ade80]"
										>{alt.comparison.pricing.pictify.pro}</td
									>
									<td class="px-6 py-4 font-medium text-gray-600"
										>{alt.comparison.pricing.competitor.pro ||
											alt.comparison.pricing.competitor.advanced ||
											alt.comparison.pricing.competitor.growth ||
											'-'}</td
									>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
			{/if}

			<!-- Migration Section -->
			{#if alt.comparison.migration && alt.comparison.migration.difficulty !== 'N/A'}
				<section class="mb-12">
					<h2 class="text-2xl font-black text-gray-900 mb-6">Switching is Easy</h2>
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0_0_#4ade80]"
					>
						<div class="flex flex-wrap gap-6 mb-6">
							<div>
								<span class="text-sm font-bold text-gray-500 uppercase">Difficulty</span>
								<p class="text-xl font-black text-[#4ade80]">
									{alt.comparison.migration.difficulty}
								</p>
							</div>
							<div>
								<span class="text-sm font-bold text-gray-500 uppercase">Time Estimate</span>
								<p class="text-xl font-black text-gray-900">
									{alt.comparison.migration.timeEstimate}
								</p>
							</div>
						</div>
						<div>
							<span class="text-sm font-bold text-gray-500 uppercase mb-3 block"
								>Migration Steps</span
							>
							<ol class="space-y-2">
								{#each alt.comparison.migration.steps as step, i}
									<li class="flex items-center gap-3">
										<span
											class="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold"
											>{i + 1}</span
										>
										<span class="text-gray-700 font-medium">{step}</span>
									</li>
								{/each}
							</ol>
						</div>
					</div>
				</section>
			{/if}

			<!-- FAQs -->
			{#if alt.comparison.faqs && alt.comparison.faqs.length > 0}
				<section class="mb-12">
					<h2 class="text-2xl font-black text-gray-900 mb-6">Frequently Asked Questions</h2>
					<div class="space-y-4">
						{#each alt.comparison.faqs as faq}
							<div class="bg-white border-[3px] border-gray-200 rounded-xl p-6">
								<h3 class="text-lg font-black text-gray-900 mb-2">{faq.q}</h3>
								<p class="text-gray-600 font-medium">{faq.a}</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- CTA Section -->
			<section
				class="mb-12 bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#4ade80]"
			>
				<h2 class="text-3xl md:text-4xl font-black text-white mb-4">Ready to Switch?</h2>
				<p class="text-gray-400 font-bold mb-8 max-w-xl mx-auto">
					Join teams who've already made the move. Start generating images in minutes.
				</p>
				<div class="flex flex-wrap justify-center gap-4">
					<a
						href="/signup"
						class="px-8 py-4 bg-[#4ade80] text-gray-900 border-[3px] border-white font-black uppercase tracking-wide shadow-[4px_4px_0_0_#fff] hover:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
					>
						{alt.cta}
					</a>
					<a
						href="/compare/{alt.comparison.slug}"
						class="px-8 py-4 bg-transparent text-white border-[3px] border-white font-black uppercase tracking-wide hover:bg-white hover:text-gray-900 transition-all rounded-xl"
					>
						Full Comparison
					</a>
				</div>
			</section>

			<!-- Other Alternatives -->
			<section>
				<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-6 text-center">
					Other Alternatives
				</h2>
				<div class="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
					{#each otherAlts as other}
						{@const otherIcon = brandIcons[other.slug] || brandIcons.default}
						<a
							href="/alternatives/{other.slug}"
							class="bg-white border-[3px] border-gray-900 p-4 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#4ade80] transition-all group"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-8 h-8 bg-white border-[2px] border-gray-900 rounded-lg flex items-center justify-center"
									style="color: {otherIcon.color || '#1f2937'}"
								>
									{#if otherIcon.type === 'url'}
										<img src={otherIcon.url} alt={other.competitor} class="w-4 h-4" />
									{:else if otherIcon.type === 'text'}
										<span class="text-xs font-black" style="color: {otherIcon.color}"
											>{otherIcon.text}</span
										>
									{:else if otherIcon.type === 'svg'}
										<svg class="w-4 h-4" fill="currentColor" viewBox={otherIcon.viewBox}>
											<path d={otherIcon.path} />
										</svg>
									{:else}
										<span class="text-xs font-black">{other.competitor.charAt(0)}</span>
									{/if}
								</div>
								<span class="font-black text-gray-900 text-sm">{other.competitor}</span>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<!-- Not Found State -->
			<div
				class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 px-4"
			>
				<div
					class="w-24 h-24 bg-[#4ade80] rounded-full border-[4px] border-gray-900 flex items-center justify-center text-5xl font-black text-gray-900 shadow-[8px_8px_0_0_#1f2937]"
				>
					?
				</div>
				<h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900">
					Alternative not found
				</h1>
				<a
					href="/alternatives"
					class="px-8 py-4 bg-[#4ade80] border-[3px] border-gray-900 text-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					View All Alternatives
				</a>
			</div>
		{/if}
	</main>

	<Footer />
</section>
