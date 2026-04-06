<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { glossary } from '$lib/pseo/config.js';

	$: termId = $page.params.term;
	$: term = glossary.find((t) => t.term === termId);
	$: validTerm = !!term;

	// Redirect if not found
	$: if (browser && !validTerm && termId) {
		goto('/glossary');
	}

	// Related terms
	$: relatedTerms = term?.relatedTerms
		? term.relatedTerms.map((t) => glossary.find((g) => g.term === t)).filter(Boolean)
		: [];

	// Other terms for navigation
	$: otherTerms = glossary.filter((t) => t.term !== termId).slice(0, 4);

	// SEO
	$: title = validTerm
		? `${term.title} | Image Generation Glossary | Pictify`
		: 'Glossary | Pictify';
	$: description = validTerm ? term.shortDefinition : 'Learn image generation terminology.';
	$: canonical = validTerm
		? `https://pictify.io/glossary/${termId}`
		: 'https://pictify.io/glossary';

	// Structured data (DefinedTerm)
	$: structuredData = validTerm
		? {
				'@context': 'https://schema.org',
				'@type': 'DefinedTerm',
				name: term.title,
				description: term.longDefinition,
				url: canonical,
				inDefinedTermSet: {
					'@type': 'DefinedTermSet',
					name: 'Image Generation Glossary',
					url: 'https://pictify.io/glossary'
				}
		  }
		: null;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="keywords" content={term?.seoKeywords?.join(', ') || term?.title} />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:image" content="https://media.pictify.io/8ixg5-1775406897273.png" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://media.pictify.io/8ixg5-1775406897273.png" />

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
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>

	<main
		class="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10"
	>
		{#if validTerm}
			<!-- Breadcrumb -->
			<nav class="mb-8">
				<ol class="flex items-center gap-2 text-sm font-bold">
					<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
					<li class="text-gray-400">/</li>
					<li><a href="/glossary" class="text-gray-500 hover:text-gray-900">Glossary</a></li>
					<li class="text-gray-400">/</li>
					<li class="text-gray-900">{term.title}</li>
				</ol>
			</nav>

			<!-- Main Content Card -->
			<article
				class="bg-white border-[4px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden mb-12"
			>
				<!-- Header -->
				<div class="bg-[#ffc480] border-b-[4px] border-gray-900 p-8">
					<div
						class="inline-block px-3 py-1 bg-white border-[2px] border-gray-900 rounded-full text-xs font-black uppercase tracking-wide mb-4"
					>
						Definition
					</div>
					<h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
						{term.title}
					</h1>
				</div>

				<!-- Content -->
				<div class="p-8 md:p-12">
					<!-- Short Definition -->
					<div class="bg-gray-50 border-[3px] border-gray-200 rounded-xl p-6 mb-8">
						<p class="text-xl text-gray-800 font-bold leading-relaxed">
							{term.shortDefinition}
						</p>
					</div>

					<!-- Long Definition -->
					<div class="prose prose-lg max-w-none">
						<p class="text-gray-700 font-medium leading-relaxed whitespace-pre-line">
							{term.longDefinition}
						</p>
					</div>
				</div>
			</article>

			<!-- Related Terms -->
			{#if relatedTerms.length > 0}
				<section class="mb-12">
					<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-6">
						Related Terms
					</h2>
					<div class="grid sm:grid-cols-2 gap-4">
						{#each relatedTerms as related}
							<a
								href="/glossary/{related.term}"
								class="bg-white border-[3px] border-gray-900 p-5 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
							>
								<h3
									class="font-black text-gray-900 mb-1 group-hover:text-[#ff6b6b] transition-colors"
								>
									{related.title}
								</h3>
								<p class="text-sm text-gray-500 font-medium line-clamp-1">
									{related.shortDefinition}
								</p>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- CTA Section -->
			<section
				class="mb-12 bg-[#4ade80]/10 border-[3px] border-[#4ade80] rounded-2xl p-8 text-center"
			>
				<h2 class="text-2xl font-black text-gray-900 mb-3">Put it into practice</h2>
				<p class="text-gray-600 font-bold mb-6">
					Now that you understand {term.title.toLowerCase()}, try it yourself with Pictify.
				</p>
				<a
					href="/tools/og-image-generator"
					class="inline-block px-6 py-3 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
				>
					Try OG Image Generator
				</a>
			</section>

			<!-- Browse More Terms -->
			<section>
				<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-6">
					Explore More Terms
				</h2>
				<div class="flex flex-wrap gap-3">
					{#each otherTerms as other}
						<a
							href="/glossary/{other.term}"
							class="px-4 py-2 bg-white border-[2px] border-gray-900 rounded-lg font-bold text-gray-900 hover:bg-[#ffc480] transition-colors shadow-[2px_2px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px]"
						>
							{other.title}
						</a>
					{/each}
					<a
						href="/glossary"
						class="px-4 py-2 bg-gray-900 text-white border-[2px] border-gray-900 rounded-lg font-bold hover:bg-gray-700 transition-colors"
					>
						View All →
					</a>
				</div>
			</section>
		{:else}
			<!-- Not Found State -->
			<div
				class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 px-4"
			>
				<div
					class="w-24 h-24 bg-[#ff6b6b] rounded-full border-[4px] border-gray-900 flex items-center justify-center text-5xl font-black text-white shadow-[8px_8px_0_0_#1f2937]"
				>
					?
				</div>
				<h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900">
					Term not found
				</h1>
				<a
					href="/glossary"
					class="px-8 py-4 bg-[#ffc480] border-[3px] border-gray-900 text-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					Browse Glossary
				</a>
			</div>
		{/if}
	</main>

	<Footer />
</section>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
