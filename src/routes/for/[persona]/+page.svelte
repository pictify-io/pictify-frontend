<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { personas } from '$lib/pseo/config.js';

	$: personaId = $page.params.persona;
	$: persona = personas.find((p) => p.slug === personaId);
	$: validPersona = !!persona;

	// Redirect if not found
	$: if (browser && !validPersona && personaId) {
		goto('/');
	}

	// Other personas for navigation
	$: otherPersonas = personas.filter((p) => p.slug !== personaId).slice(0, 4);

	// SEO
	$: title = validPersona
		? `${persona.title} | Image Generation for ${persona.slug.replace('-', ' ')}`
		: 'Pictify for Teams';
	$: description = validPersona
		? persona.description
		: 'Pictify helps teams generate images at scale.';
	$: canonical = validPersona ? `https://pictify.io/for/${personaId}` : 'https://pictify.io';

	// Structured data
	$: structuredData = validPersona
		? {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				name: persona.title,
				description: persona.description,
				url: canonical,
				mainEntity: {
					'@type': 'SoftwareApplication',
					name: 'Pictify',
					description: persona.description,
					applicationCategory: 'DesignApplication',
					offers: {
						'@type': 'Offer',
						price: '0',
						priceCurrency: 'USD'
					}
				}
		  }
		: null;

	// Persona icons
	const personaIcons = {
		developers: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />`,
		marketers: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />`,
		'product-teams': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />`,
		agencies: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />`,
		'saas-founders': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />`,
		'e-commerce': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />`
	};
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="pictify for {personaId?.replace('-', ' ')}, image generation {personaId?.replace(
			'-',
			' '
		)}, {personaId?.replace('-', ' ')} tools"
	/>

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://pictify.io/og-image-tools.jpg" />

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
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"
	/>

	<main
		class="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10"
	>
		{#if validPersona}
			<!-- Breadcrumb -->
			<nav class="mb-8">
				<ol class="flex items-center gap-2 text-sm font-bold">
					<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
					<li class="text-gray-400">/</li>
					<li class="text-gray-900">{persona.title}</li>
				</ol>
			</nav>

			<!-- Hero Section -->
			<div
				class="relative flex flex-col items-center justify-center text-center mb-16 pt-4 sm:pt-8"
			>
				<!-- Icon -->
				<div
					class="w-20 h-20 bg-[#ff6b6b] border-[4px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[6px_6px_0_0_#1f2937] mb-8"
				>
					<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{@html personaIcons[personaId] || personaIcons.developers}
					</svg>
				</div>

				<!-- Title -->
				<h1
					class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6"
				>
					{persona.headline}
				</h1>

				<!-- Description -->
				<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed max-w-2xl mb-8">
					{persona.description}
				</p>

				<!-- CTA Button -->
				<a
					href={persona.ctaUrl}
					class="px-8 py-4 bg-[#ff6b6b] text-white border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					{persona.cta}
				</a>
			</div>

			<!-- Benefits Section -->
			<section class="mb-20">
				<h2
					class="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 mb-8 text-center"
				>
					Why {personaId.replace('-', ' ')} love Pictify
				</h2>
				<div class="grid sm:grid-cols-2 gap-6">
					{#each persona.benefits as benefit, i}
						<div
							class="bg-white border-[3px] border-gray-900 p-6 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 transition-all"
						>
							<div class="flex items-start gap-4">
								<div
									class="w-10 h-10 bg-[#4ade80] border-[3px] border-gray-900 rounded-xl flex items-center justify-center font-black text-gray-900 shadow-[3px_3px_0_0_#1f2937] flex-shrink-0"
								>
									{i + 1}
								</div>
								<p class="text-gray-800 font-bold text-lg">{benefit}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Use Cases Section -->
			<section class="mb-20">
				<h2
					class="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 mb-8 text-center"
				>
					What you can do
				</h2>
				<div class="bg-[#ffc480]/20 border-[3px] border-[#ffc480] rounded-2xl p-8">
					<div class="grid md:grid-cols-2 gap-6">
						{#each persona.useCases as useCase}
							<div class="flex items-start gap-4">
								<div
									class="w-6 h-6 bg-[#ffc480] border-[2px] border-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
								>
									<svg
										class="w-3 h-3 text-gray-900"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>
								<p class="text-gray-800 font-bold">{useCase}</p>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- Testimonial Section -->
			{#if persona.testimonial}
				<section class="mb-20">
					<div
						class="bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 shadow-[8px_8px_0_0_#ff6b6b] relative overflow-hidden"
					>
						<div class="absolute top-4 left-4 text-6xl text-gray-700 opacity-50">"</div>
						<div class="relative z-10 text-center">
							<p class="text-2xl md:text-3xl text-white font-bold leading-relaxed mb-6 italic">
								"{persona.testimonial.quote}"
							</p>
							<div class="text-gray-400 font-bold">
								<span class="text-white">{persona.testimonial.author}</span>
								<span class="mx-2">·</span>
								<span>{persona.testimonial.company}</span>
							</div>
						</div>
					</div>
				</section>
			{/if}

			<!-- CTA Section -->
			<section
				class="mb-20 bg-white border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#4ade80]"
			>
				<h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-4">Ready to get started?</h2>
				<p class="text-gray-600 font-bold mb-8 max-w-xl mx-auto">
					Join thousands of {personaId.replace('-', ' ')} who use Pictify to generate images at scale.
				</p>
				<div class="flex flex-wrap justify-center gap-4">
					<a
						href={persona.ctaUrl}
						class="px-8 py-4 bg-[#ff6b6b] text-white border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
					>
						{persona.cta}
					</a>
					<a
						href="/pricing"
						class="px-8 py-4 bg-white text-gray-900 border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
					>
						View Pricing
					</a>
				</div>
			</section>

			<!-- Other Personas -->
			<section>
				<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-8 text-center">
					Also built for
				</h2>
				<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each otherPersonas as otherPersona}
						<a
							href="/for/{otherPersona.slug}"
							class="bg-white border-[3px] border-gray-900 p-5 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ffc480] transition-all group"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-10 h-10 bg-gray-100 group-hover:bg-white border-[2px] border-gray-900 rounded-lg flex items-center justify-center"
								>
									<svg
										class="w-5 h-5 text-gray-900"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										{@html personaIcons[otherPersona.slug] || personaIcons.developers}
									</svg>
								</div>
								<span class="font-black text-gray-900 text-sm capitalize"
									>{otherPersona.slug.replace('-', ' ')}</span
								>
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
					class="w-24 h-24 bg-[#ff6b6b] rounded-full border-[4px] border-gray-900 flex items-center justify-center text-5xl font-black text-white shadow-[8px_8px_0_0_#1f2937]"
				>
					?
				</div>
				<h1 class="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900">
					Page not found
				</h1>
				<a
					href="/"
					class="px-8 py-4 bg-[#ffc480] border-[3px] border-gray-900 text-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					Go Home
				</a>
			</div>
		{/if}
	</main>

	<Footer />
</section>
