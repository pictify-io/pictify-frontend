<script>
import Nav from '$lib/components/landingPage/Nav.svelte';
import Footer from '$lib/components/landingPage/Footer.svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { alternatives } from '$lib/pseo/comparisons.js';

$: slug = $page.params.slug;
$: alt = alternatives.find(a => a.slug === slug);
$: validAlt = !!alt;

// Redirect if not found
$: if (browser && !validAlt && slug) {
	goto('/alternatives');
}

// Other alternatives for navigation
$: otherAlts = alternatives.filter(a => a.slug !== slug).slice(0, 4);

// SEO
$: title = validAlt
	? `Best ${alt.competitor} Alternative (2025) | Pictify`
	: 'Alternative | Pictify';
$: description = validAlt
	? alt.metaDescription
	: 'Find the best alternative for your image generation needs.';
$: canonical = validAlt
	? `https://pictify.io/alternatives/${slug}`
	: 'https://pictify.io/alternatives';

// Structured data with FAQ
$: structuredData = validAlt ? {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: alt.comparison.faqs.map(faq => ({
		'@type': 'Question',
		name: faq.q,
		acceptedAnswer: {
			'@type': 'Answer',
			text: faq.a
		}
	}))
} : null;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="keywords" content="{alt?.competitor?.toLowerCase()} alternative, switch from {alt?.competitor?.toLowerCase()}, {alt?.competitor?.toLowerCase()} replacement, pictify vs {alt?.competitor?.toLowerCase()}" />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="article" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />

	{#if structuredData}
		{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{/if}
</svelte:head>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-hidden font-['Manrope']">
	<Nav />

	<!-- Background Elements -->
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#4ade80]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

	<main class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10">
		{#if validAlt}
			<!-- Breadcrumb -->
			<nav class="mb-8">
				<ol class="flex items-center gap-2 text-sm font-bold">
					<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
					<li class="text-gray-400">/</li>
					<li><a href="/alternatives" class="text-gray-500 hover:text-gray-900">Alternatives</a></li>
					<li class="text-gray-400">/</li>
					<li class="text-gray-900">{alt.competitor}</li>
				</ol>
			</nav>

			<!-- Hero Section -->
			<div class="relative flex flex-col items-center justify-center text-center mb-12 pt-4 sm:pt-8">
				<!-- Badge -->
				<div class="inline-flex transform -rotate-1 hover:rotate-0 transition-transform duration-300 cursor-default mb-6">
					<div class="px-5 py-2 bg-[#4ade80] border-[3px] border-gray-900 text-gray-900 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] rounded-lg">
						Alternative to {alt.competitor}
					</div>
				</div>

				<!-- Title -->
				<h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
					{alt.headline}
				</h1>

				<!-- TL;DR -->
				<div class="bg-white border-[3px] border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_0_#ffc480] max-w-3xl">
					<p class="text-gray-700 font-bold leading-relaxed">
						<span class="text-[#ff6b6b] font-black">TL;DR:</span> {alt.comparison.tldr}
					</p>
				</div>
			</div>

			<!-- Why Switch Section -->
			<section class="mb-12">
				<h2 class="text-2xl font-black text-gray-900 mb-6">Why Switch from {alt.competitor}?</h2>
				<div class="grid md:grid-cols-2 gap-4">
					{#each alt.comparison.advantages as advantage, i}
						<div class="flex items-start gap-3 bg-white border-[2px] border-gray-200 rounded-xl p-4">
							<div class="w-8 h-8 bg-[#4ade80] border-[2px] border-gray-900 rounded-lg flex items-center justify-center font-black text-gray-900 text-sm flex-shrink-0">
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
				<div class="bg-[#4ade80]/10 border-[3px] border-[#4ade80] rounded-2xl p-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 bg-[#4ade80] border-[2px] border-gray-900 rounded-lg flex items-center justify-center font-black text-gray-900 text-sm">
							P
						</div>
						<h3 class="text-xl font-black text-gray-900">Choose Pictify if...</h3>
					</div>
					<p class="text-gray-700 font-medium mb-4">
						{alt.comparison.bestFor.pictify}
					</p>
					<div class="space-y-2">
						{#each alt.comparison.advantages.slice(0, 4) as adv}
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-[#4ade80] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-sm text-gray-700 font-medium">{adv}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Competitor Card -->
				<div class="bg-gray-100 border-[3px] border-gray-300 rounded-2xl p-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-10 h-10 bg-gray-300 border-[2px] border-gray-400 rounded-lg flex items-center justify-center font-black text-gray-600 text-sm">
							{alt.competitor.charAt(0)}
						</div>
						<h3 class="text-xl font-black text-gray-700">Stay with {alt.competitor} if...</h3>
					</div>
					<p class="text-gray-600 font-medium mb-4">
						{alt.comparison.bestFor.competitor}
					</p>
					<div class="space-y-2">
						{#each alt.comparison.competitorAdvantages.slice(0, 4) as adv}
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-sm text-gray-600 font-medium">{adv}</span>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Pricing Comparison -->
			{#if alt.comparison.pricing}
				<section class="mb-12">
					<h2 class="text-2xl font-black text-gray-900 mb-6">Pricing Comparison</h2>
					<div class="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]">
						<table class="w-full">
							<thead class="bg-gray-900 text-white">
								<tr>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm">Plan</th>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm">Pictify</th>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm">{alt.competitor}</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								<tr>
									<td class="px-6 py-4 font-bold text-gray-900">Free</td>
									<td class="px-6 py-4 font-medium text-[#4ade80]">{alt.comparison.pricing.pictify.free}</td>
									<td class="px-6 py-4 font-medium text-gray-600">{alt.comparison.pricing.competitor.free || 'None'}</td>
								</tr>
								<tr class="bg-gray-50">
									<td class="px-6 py-4 font-bold text-gray-900">Starter</td>
									<td class="px-6 py-4 font-medium text-[#4ade80]">{alt.comparison.pricing.pictify.starter}</td>
									<td class="px-6 py-4 font-medium text-gray-600">{alt.comparison.pricing.competitor.starter}</td>
								</tr>
								<tr>
									<td class="px-6 py-4 font-bold text-gray-900">Pro</td>
									<td class="px-6 py-4 font-medium text-[#4ade80]">{alt.comparison.pricing.pictify.pro}</td>
									<td class="px-6 py-4 font-medium text-gray-600">{alt.comparison.pricing.competitor.pro || alt.comparison.pricing.competitor.advanced || alt.comparison.pricing.competitor.growth || '-'}</td>
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
					<div class="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0_0_#4ade80]">
						<div class="flex flex-wrap gap-6 mb-6">
							<div>
								<span class="text-sm font-bold text-gray-500 uppercase">Difficulty</span>
								<p class="text-xl font-black text-[#4ade80]">{alt.comparison.migration.difficulty}</p>
							</div>
							<div>
								<span class="text-sm font-bold text-gray-500 uppercase">Time Estimate</span>
								<p class="text-xl font-black text-gray-900">{alt.comparison.migration.timeEstimate}</p>
							</div>
						</div>
						<div>
							<span class="text-sm font-bold text-gray-500 uppercase mb-3 block">Migration Steps</span>
							<ol class="space-y-2">
								{#each alt.comparison.migration.steps as step, i}
									<li class="flex items-center gap-3">
										<span class="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold">{i + 1}</span>
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
			<section class="mb-12 bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#4ade80]">
				<h2 class="text-3xl md:text-4xl font-black text-white mb-4">
					Ready to Switch?
				</h2>
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
						<a
							href="/alternatives/{other.slug}"
							class="bg-white border-[3px] border-gray-900 p-4 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#4ade80] transition-all group text-center"
						>
							<span class="font-black text-gray-900 text-sm">{other.competitor}</span>
						</a>
					{/each}
				</div>
			</section>

		{:else}
			<!-- Not Found State -->
			<div class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 px-4">
				<div class="w-24 h-24 bg-[#4ade80] rounded-full border-[4px] border-gray-900 flex items-center justify-center text-5xl font-black text-gray-900 shadow-[8px_8px_0_0_#1f2937]">?</div>
				<h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900">Alternative not found</h1>
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
