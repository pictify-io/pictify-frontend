<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { templateCategories, useCases, useCaseDetails, popularSizes } from '$lib/pseo/config.js';

	$: categoryId = $page.params.category;
	$: category = templateCategories.find((c) => c.id === categoryId);
	$: validCategory = !!category;

	// Redirect to templates page if category not found
	$: if (browser && !validCategory && categoryId) {
		goto('/templates');
	}

	// Get related use cases for this category
	$: relatedUseCases = category?.relatedUseCases
		? category.relatedUseCases
				.map((id) => (useCaseDetails[id] ? { id, ...useCaseDetails[id] } : null))
				.filter(Boolean)
		: [];

	// Get other categories for navigation
	$: otherCategories = templateCategories.filter((c) => c.id !== categoryId).slice(0, 4);

	// SEO
	$: title = validCategory
		? `${category.label} Templates | Free ${category.label} Generator | Pictify`
		: 'Template Categories | Pictify';
	$: description = validCategory
		? category.description
		: 'Browse template categories for social media, marketing, certificates, and more.';
	$: canonical = validCategory
		? `https://pictify.io/templates/category/${categoryId}`
		: 'https://pictify.io/templates';

	// Structured data
	$: structuredData = validCategory
		? {
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				name: `${category.label} Templates`,
				description: category.description,
				url: canonical,
				mainEntity: {
					'@type': 'ItemList',
					itemListElement: relatedUseCases.map((uc, i) => ({
						'@type': 'ListItem',
						position: i + 1,
						item: {
							'@type': 'SoftwareApplication',
							name: uc.label,
							description: uc.description,
							url: `https://pictify.io/tools/${uc.id}`,
							applicationCategory: 'DesignApplication'
						}
					}))
				}
		  }
		: null;

	// Icon mapping
	const iconMap = {
		share: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />`,
		users: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />`,
		'shopping-cart': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />`,
		megaphone: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />`,
		award: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />`,
		'chart-bar': `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />`,
		code: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />`
	};
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="{category?.keywords?.join(', ') || 'templates, image generator'}, Pictify"
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

	<main
		class="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10"
	>
		{#if validCategory}
			<!-- Breadcrumb -->
			<nav class="mb-8">
				<ol class="flex items-center gap-2 text-sm font-bold">
					<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
					<li class="text-gray-400">/</li>
					<li><a href="/templates" class="text-gray-500 hover:text-gray-900">Templates</a></li>
					<li class="text-gray-400">/</li>
					<li class="text-gray-900">{category.label}</li>
				</ol>
			</nav>

			<!-- Hero Section -->
			<div
				class="relative flex flex-col items-center justify-center text-center mb-16 pt-4 sm:pt-8"
			>
				<!-- Icon -->
				<div
					class="w-20 h-20 bg-[#ffc480] border-[4px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[6px_6px_0_0_#1f2937] mb-8"
				>
					<svg
						class="w-10 h-10 text-gray-900"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						{@html iconMap[category.icon] || iconMap.share}
					</svg>
				</div>

				<!-- Title -->
				<h1
					class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6"
				>
					{category.label}
					<span class="block text-[#ff6b6b]">Templates</span>
				</h1>

				<!-- Description -->
				<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed max-w-2xl">
					{category.description}
				</p>
			</div>

			<!-- Recommended Sizes -->
			{#if category.recommendedSizes?.length}
				<div class="mb-16">
					<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-6 text-center">
						Recommended Sizes
					</h2>
					<div class="flex flex-wrap justify-center gap-4">
						{#each category.recommendedSizes as size}
							<a
								href="/tools/html-to-png/{size}"
								class="px-6 py-3 bg-white border-[3px] border-gray-900 font-bold shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
							>
								{size}
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Related Use Cases / Workflows -->
			{#if relatedUseCases.length}
				<section class="mb-20">
					<h2
						class="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 mb-8 text-center"
					>
						Related Workflows
					</h2>
					<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each relatedUseCases as uc}
							<a
								href="/tools/{uc.id}"
								class="bg-white border-[3px] border-gray-900 p-6 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all group"
							>
								<h3
									class="text-xl font-black text-gray-900 mb-2 group-hover:text-[#ff6b6b] transition-colors"
								>
									{uc.label}
								</h3>
								<p class="text-gray-600 font-medium mb-4">
									{uc.description}
								</p>
								<span
									class="text-sm font-bold text-[#ff6b6b] uppercase tracking-wide flex items-center gap-2"
								>
									Try it free
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 8l4 4m0 0l-4 4m4-4H3"
										/>
									</svg>
								</span>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Browse All Templates CTA -->
			<section
				class="mb-20 bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#ff6b6b]"
			>
				<h2 class="text-3xl md:text-4xl font-black text-white mb-4">Browse All Templates</h2>
				<p class="text-gray-400 font-bold mb-8 max-w-xl mx-auto">
					Explore our full template gallery with hundreds of ready-to-use designs across all
					categories.
				</p>
				<a
					href="/templates"
					class="inline-block px-8 py-4 bg-[#ff6b6b] text-white border-[3px] border-white font-black uppercase tracking-wide shadow-[4px_4px_0_0_#fff] hover:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
				>
					View All Templates
				</a>
			</section>

			<!-- Other Categories -->
			<section class="mb-20">
				<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-8 text-center">
					Explore Other Categories
				</h2>
				<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{#each otherCategories as cat}
						<a
							href="/templates/category/{cat.id}"
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
										{@html iconMap[cat.icon] || iconMap.share}
									</svg>
								</div>
								<span class="font-black text-gray-900">{cat.label}</span>
							</div>
						</a>
					{/each}
				</div>
			</section>

			<!-- Keywords for SEO -->
			<section class="text-center">
				<h3 class="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
					Related Topics
				</h3>
				<div class="flex flex-wrap justify-center gap-2">
					{#each category.keywords || [] as keyword}
						<span
							class="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-600"
						>
							{keyword}
						</span>
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
					Category not found
				</h1>
				<a
					href="/templates"
					class="px-8 py-4 bg-[#ffc480] border-[3px] border-gray-900 text-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					Browse All Templates
				</a>
			</div>
		{/if}
	</main>

	<Footer />
</section>
