<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { comparisons } from '$lib/pseo/config.js';
	import { brandIcons } from '$lib/config/brandIcons.js';

	$: slug = $page.params.slug;
	$: comparison = comparisons.find((c) => c.slug === slug);
	$: validComparison = !!comparison;
	$: competitorSlug = validComparison ? slug.split('-vs-')[1] : null;
	$: icon = validComparison ? brandIcons[competitorSlug] || brandIcons.default : brandIcons.default;

	// Redirect if not found
	$: if (browser && !validComparison && slug) {
		goto('/compare');
	}

	// Other comparisons for navigation
	$: otherComparisons = comparisons.filter((c) => c.slug !== slug).slice(0, 3);

	// SEO
	$: title = validComparison
		? `${comparison.title} (2025) | Honest Comparison`
		: 'Comparison | Pictify';
	$: description = validComparison
		? comparison.metaDescription
		: 'Compare image generation services.';
	$: canonical = validComparison
		? `https://pictify.io/compare/${slug}`
		: 'https://pictify.io/compare';

	// Pricing tier display names and order
	const tierOrder = [
		'free',
		'basic',
		'starter',
		'plus',
		'pro',
		'growth',
		'scale',
		'business',
		'prime',
		'enterprise',
		'server',
		'devops',
		'advanced',
		'delivery'
	];
	const tierDisplayNames = {
		free: 'Free',
		basic: 'Basic',
		starter: 'Starter',
		plus: 'Plus',
		pro: 'Pro',
		growth: 'Growth',
		scale: 'Scale',
		business: 'Business',
		prime: 'Prime',
		enterprise: 'Enterprise',
		server: 'Server',
		devops: 'DevOps',
		advanced: 'Advanced',
		delivery: 'Delivery'
	};

	// Compute unified pricing rows from both sides
	$: pricingTiers =
		validComparison && comparison.pricing
			? (() => {
					const allKeys = new Set([
						...Object.keys(comparison.pricing.pictify || {}),
						...Object.keys(comparison.pricing.competitor || {})
					]);
					return tierOrder
						.filter((k) => allKeys.has(k))
						.map((k) => ({
							name: tierDisplayNames[k] || k.charAt(0).toUpperCase() + k.slice(1),
							pictify: comparison.pricing.pictify[k] || '-',
							competitor: comparison.pricing.competitor[k] || '-'
						}));
			  })()
			: [];

	// Feature labels for display
	const featureLabels = {
		htmlToImage: 'HTML to Image',
		templateEditor: 'Template Editor',
		apiSimplicity: 'API Simplicity',
		mediaManagement: 'Media Management',
		videoProcessing: 'Video Processing',
		cdnDelivery: 'CDN Delivery',
		batchProcessing: 'Batch Processing',
		webhooks: 'Webhooks',
		imageTransformations: 'Image Transformations',
		urlBasedApi: 'URL-based API',
		smartCropping: 'Smart Cropping',
		apiFlexibility: 'API Flexibility',
		noCodeFriendly: 'No-Code Friendly',
		socialIntegration: 'Social Integration',
		setupTime: 'Setup Time',
		maintenance: 'Maintenance',
		customization: 'Customization',
		scalability: 'Scalability',
		reliability: 'Reliability',
		cost: 'Cost Effectiveness',
		urlScreenshot: 'URL Screenshot',
		fullPageCapture: 'Full Page Capture',
		geoLocations: 'Geo Locations',
		customGraphics: 'Custom Graphics',
		pdfGeneration: 'PDF Generation',
		dynamicContent: 'Dynamic Content',
		imageGeneration: 'Image Generation',
		browserAutomation: 'Browser Automation',
		setupSimplicity: 'Setup Simplicity',
		scraping: 'Scraping',
		customScripts: 'Custom Scripts',
		screenshotQuality: 'Screenshot Quality',
		s3Integration: 'S3 Integration',
		metadataExtraction: 'Metadata Extraction',
		openSource: 'Open Source',
		apiVersatility: 'API Versatility',
		designFlexibility: 'Design Flexibility',
		pricing: 'Pricing Value',
		integrations: 'Integrations',
		// New feature labels for added competitors
		cssSupport: 'CSS Support',
		edgeRuntime: 'Edge Runtime',
		frameworkSupport: 'Framework Support',
		abTesting: 'A/B Testing',
		analytics: 'Analytics',
		outputFormats: 'Output Formats',
		speed: 'Speed',
		fileUpload: 'File Upload',
		imageOptimization: 'Image Optimization',
		imageStorage: 'Image Storage',
		edgeDelivery: 'Edge Delivery',
		autoOptimization: 'Auto Optimization',
		dynamicGeneration: 'Dynamic Generation',
		crossBrowser: 'Cross Browser',
		testing: 'Testing Features',
		scheduling: 'Scheduling',
		visualArchive: 'Visual Archive',
		apiAccess: 'API Access',
		changeDetection: 'Change Detection',
		multiPage: 'Multi-Page Support',
		webOptimized: 'Web Optimized',
		printReady: 'Print Ready',
		// New feature labels for additional competitors
		marketingAutomation: 'Marketing Automation',
		multiFormatExport: 'Multi-Format Export',
		stockAssets: 'Stock Assets',
		ogImageFocus: 'OG Image Focus',
		useCaseVariety: 'Use Case Variety',
		simplicity: 'Simplicity',
		socialOptimization: 'Social Optimization',
		presetTemplates: 'Preset Templates',
		textOverlay: 'Text Overlay',
		cdnPerformance: 'CDN Performance',
		apiIntegration: 'API Integration',
		figmaIntegration: 'Figma Integration',
		productionScale: 'Production Scale',
		zapierIntegration: 'Zapier Integration',
		pdfSupport: 'PDF Support',
		imageCdn: 'Image CDN',
		mediaLibrary: 'Media Library',
		chartGeneration: 'Chart Generation',
		canvaImport: 'Canva Import',
		figmaImport: 'Figma Import',
		aiTemplates: 'AI Templates',
		noCodeIntegrations: 'No-Code Integrations',
		videoGeneration: 'Video Generation',
		smartLinks: 'Smart Links',
		scheduledExperiments: 'Scheduled Experiments',
		experimentAnalytics: 'Experiment Analytics'
	};

	// Structured data with FAQ schema
	$: structuredData = validComparison
		? {
				'@context': 'https://schema.org',
				'@graph': [
					{
						'@type': 'Article',
						headline: comparison.title,
						description: comparison.metaDescription,
						url: canonical,
						author: {
							'@type': 'Organization',
							name: 'Pictify'
						},
						publisher: {
							'@type': 'Organization',
							name: 'Pictify',
							url: 'https://pictify.io'
						}
					},
					...(comparison.faqs && comparison.faqs.length > 0
						? [
								{
									'@type': 'FAQPage',
									mainEntity: comparison.faqs.map((faq) => ({
										'@type': 'Question',
										name: faq.q,
										acceptedAnswer: {
											'@type': 'Answer',
											text: faq.a
										}
									}))
								}
						  ]
						: [])
				]
		  }
		: null;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="{comparison?.title?.toLowerCase()}, comparison, alternative, {comparison?.competitor?.toLowerCase()} alternative"
	/>

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:image" content="https://media.pictify.io/qyw0z-1775406908773.png" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://media.pictify.io/qyw0z-1775406908773.png" />

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
		class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10"
	>
		{#if validComparison}
			<!-- Breadcrumb -->
			<nav class="mb-8">
				<ol class="flex items-center gap-2 text-sm font-bold">
					<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
					<li class="text-gray-400">/</li>
					<li><a href="/compare" class="text-gray-500 hover:text-gray-900">Compare</a></li>
					<li class="text-gray-400">/</li>
					<li class="text-gray-900">{comparison.title}</li>
				</ol>
			</nav>

			<!-- Hero Section -->
			<div
				class="relative flex flex-col items-center justify-center text-center mb-16 pt-4 sm:pt-8"
			>
				<!-- VS Matchup -->
				<div class="flex items-center justify-center gap-4 sm:gap-8 mb-10">
					<!-- Pictify Icon -->
					<div
						class="w-20 h-20 sm:w-28 sm:h-28 bg-gray-900 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[6px_6px_0_0_#ffc480] transform -rotate-3 hover:rotate-0 transition-transform duration-300"
					>
						<svg
							class="w-10 h-10 sm:w-14 sm:h-14 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>

					<!-- VS Badge -->
					<div
						class="w-12 h-12 sm:w-16 sm:h-16 bg-[#ff6b6b] border-[3px] border-gray-900 rounded-full flex items-center justify-center font-black text-white text-lg sm:text-2xl shadow-[4px_4px_0_0_#1f2937] z-10"
					>
						VS
					</div>

					<!-- Competitor Icon -->
					<div
						class="w-20 h-20 sm:w-28 sm:h-28 bg-white border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[6px_6px_0_0_#1f2937] transform rotate-3 hover:rotate-0 transition-transform duration-300"
						style="color: {icon.color || '#1f2937'}"
					>
						{#if icon.type === 'url'}
							<img src={icon.url} alt={comparison.competitor} class="w-10 h-10 sm:w-14 sm:h-14" />
						{:else if icon.type === 'text'}
							<span class="text-2xl sm:text-4xl font-black" style="color: {icon.color}"
								>{icon.text}</span
							>
						{:else if icon.type === 'svg'}
							<svg class="w-10 h-10 sm:w-14 sm:h-14" fill="currentColor" viewBox={icon.viewBox}>
								<path d={icon.path} />
							</svg>
						{:else if icon.type === 'fa'}
							<i class="{icon.class} text-4xl sm:text-6xl" />
						{:else}
							<span class="text-xs sm:text-sm font-black text-gray-900 px-2"
								>{comparison.competitor}</span
							>
						{/if}
					</div>
				</div>

				<!-- Title -->
				<h1
					class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6"
				>
					{comparison.title}
				</h1>

				<!-- Description -->
				<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed max-w-2xl">
					{comparison.metaDescription}
				</p>
			</div>

			<!-- TL;DR Section -->
			{#if comparison.tldr}
				<section class="mb-12">
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl p-6 shadow-[4px_4px_0_0_#ffc480]"
					>
						<p class="text-gray-700 font-bold leading-relaxed">
							<span class="text-[#ff6b6b] font-black uppercase tracking-wide">TL;DR:</span>
							{comparison.tldr}
						</p>
					</div>
				</section>
			{/if}

			<!-- Quick Summary Cards -->
			<section class="grid md:grid-cols-2 gap-6 mb-16">
				<!-- Pictify Card -->
				<div
					class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_0_#4ade80]"
				>
					<div class="flex items-center gap-4 mb-6">
						<div
							class="w-14 h-14 bg-gray-900 border-[3px] border-gray-900 rounded-xl flex items-center justify-center font-black text-gray-900 text-sm shadow-[3px_3px_0_0_#ffc480]"
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
						<h2 class="text-2xl font-black text-gray-900">Pictify</h2>
					</div>
					<p class="text-gray-700 font-medium mb-6 leading-relaxed">
						{comparison.bestFor.pictify}
					</p>
					<ul class="space-y-3">
						{#each comparison.advantages as advantage}
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
								<span class="text-gray-900 font-bold">{advantage}</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Competitor Card -->
				<div class="bg-gray-50 border-[3px] border-dashed border-gray-400 rounded-2xl p-8">
					<div class="flex items-center gap-4 mb-6">
						<div
							class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center font-black text-gray-600 text-sm shadow-[3px_3px_0_0_#9ca3af]"
							style="color: {icon.color || '#1f2937'}"
						>
							{#if icon.type === 'url'}
								<img src={icon.url} alt={comparison.competitor} class="w-8 h-8" />
							{:else if icon.type === 'text'}
								<span class="text-lg font-black" style="color: {icon.color}">{icon.text}</span>
							{:else if icon.type === 'svg'}
								<svg class="w-8 h-8" fill="currentColor" viewBox={icon.viewBox}>
									<path d={icon.path} />
								</svg>
							{:else if icon.type === 'fa'}
								<i class="{icon.class} text-3xl" />
							{:else}
								<span class="text-lg font-black">{comparison.competitor.charAt(0)}</span>
							{/if}
						</div>
						<h2 class="text-2xl font-black text-gray-500">{comparison.competitor}</h2>
					</div>
					<p class="text-gray-500 font-medium mb-6 leading-relaxed">
						{comparison.bestFor.competitor}
					</p>
					<ul class="space-y-3">
						{#each comparison.competitorAdvantages as advantage}
							<li class="flex items-start gap-3">
								<div
									class="w-6 h-6 rounded-full bg-gray-200 border-[2px] border-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5"
								>
									<svg
										class="w-3 h-3 text-gray-500 font-bold"
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
								<span class="text-gray-500 font-medium">{advantage}</span>
							</li>
						{/each}
					</ul>
				</div>
			</section>

			<!-- Best For Section -->
			<section class="mb-16">
				<h2
					class="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight"
				>
					Choose Based on Your Needs
				</h2>

				<div class="grid md:grid-cols-2 gap-6">
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_0_#4ade80]"
					>
						<h3 class="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
							<span
								class="w-8 h-8 bg-[#4ade80] border-[2px] border-gray-900 rounded-lg flex items-center justify-center text-gray-900 font-black text-sm shadow-[2px_2px_0_0_#1f2937]"
								>1</span
							>
							Choose Pictify if...
						</h3>
						<p class="text-gray-700 font-medium leading-relaxed">
							{comparison.bestFor.pictify}
						</p>
					</div>

					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_0_#e5e7eb]"
					>
						<h3 class="text-xl font-black text-gray-700 mb-4 flex items-center gap-3">
							<span
								class="w-8 h-8 bg-gray-100 border-[2px] border-gray-900 rounded-lg flex items-center justify-center text-gray-500 font-black text-sm shadow-[2px_2px_0_0_#1f2937]"
								>2</span
							>
							Choose {comparison.competitor} if...
						</h3>
						<p class="text-gray-500 font-medium leading-relaxed">
							{comparison.bestFor.competitor}
						</p>
					</div>
				</div>
			</section>

			<!-- Feature Comparison Table -->
			{#if comparison.features && Object.keys(comparison.features).length > 0}
				<section class="mb-16">
					<h2
						class="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight"
					>
						Feature Comparison
					</h2>
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#1f2937]"
					>
						<table class="w-full">
							<thead class="bg-gray-900 text-white">
								<tr>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm"
										>Feature</th
									>
									<th
										class="px-6 py-4 text-center font-black uppercase tracking-wide text-sm border-l-[3px] border-gray-800"
										>Pictify</th
									>
									<th
										class="px-6 py-4 text-center font-black uppercase tracking-wide text-sm border-l-[3px] border-gray-800"
										>{comparison.competitor}</th
									>
								</tr>
							</thead>
							<tbody class="divide-y-[3px] divide-gray-100">
								{#each Object.entries(comparison.features) as [feature, scores], i}
									<tr class="{i % 2 === 1 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-50">
										<td class="px-6 py-4 font-bold text-gray-900"
											>{featureLabels[feature] || feature}</td
										>
										<td class="px-6 py-4 text-center border-l-[3px] border-gray-100">
											<div class="flex justify-center gap-1.5">
												{#each Array(5) as _, star}
													<div
														class="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-[2px] border-gray-900 {star <
														scores.pictify
															? 'bg-[#4ade80]'
															: 'bg-transparent opacity-20'}"
													/>
												{/each}
											</div>
										</td>
										<td class="px-6 py-4 text-center border-l-[3px] border-gray-100">
											<div class="flex justify-center gap-1.5">
												{#each Array(5) as _, star}
													<div
														class="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-[2px] border-gray-900 {star <
														scores.competitor
															? 'bg-gray-400'
															: 'bg-transparent opacity-20'}"
													/>
												{/each}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}

			<!-- Pricing Comparison -->
			{#if comparison.pricing}
				<section class="mb-16">
					<h2
						class="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight"
					>
						Pricing Comparison
					</h2>
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[6px_6px_0_0_#4ade80]"
					>
						<table class="w-full">
							<thead class="bg-gray-900 text-white">
								<tr>
									<th class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm"
										>Plan</th
									>
									<th
										class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm border-l-[3px] border-gray-800"
										>Pictify</th
									>
									<th
										class="px-6 py-4 text-left font-black uppercase tracking-wide text-sm border-l-[3px] border-gray-800"
										>{comparison.competitor}</th
									>
								</tr>
							</thead>
							<tbody class="divide-y-[3px] divide-gray-100">
								{#each pricingTiers as tier, i}
									<tr class={i % 2 === 1 ? 'bg-gray-50' : ''}>
										<td class="px-6 py-4 font-black text-gray-900">{tier.name}</td>
										<td class="px-6 py-4 font-bold text-[#4ade80] border-l-[3px] border-gray-100"
											>{tier.pictify}</td
										>
										<td class="px-6 py-4 font-medium text-gray-600 border-l-[3px] border-gray-100"
											>{tier.competitor}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/if}

			<!-- Migration Section -->
			{#if comparison.migration && comparison.migration.difficulty !== 'N/A'}
				<section class="mb-16">
					<h2
						class="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight"
					>
						How to Switch
					</h2>
					<div
						class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[4px_4px_0_0_#4ade80]"
					>
						<div class="flex flex-wrap gap-8 mb-8 border-b-[3px] border-gray-100 pb-8">
							<div>
								<span class="text-sm font-bold text-gray-500 uppercase tracking-wide block mb-1"
									>Difficulty</span
								>
								<div
									class="inline-flex px-3 py-1 bg-gray-900 text-white rounded-lg font-black text-sm uppercase tracking-wide"
								>
									{comparison.migration.difficulty}
								</div>
							</div>
							<div>
								<span class="text-sm font-bold text-gray-500 uppercase tracking-wide block mb-1"
									>Time Estimate</span
								>
								<p class="text-2xl font-black text-gray-900">{comparison.migration.timeEstimate}</p>
							</div>
						</div>
						<div>
							<span class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6 block"
								>Migration Steps</span
							>
							<ol class="space-y-4">
								{#each comparison.migration.steps as step, i}
									<li class="flex items-center gap-4">
										<span
											class="w-10 h-10 bg-[#4ade80] border-[3px] border-gray-900 rounded-xl flex items-center justify-center text-gray-900 text-lg font-black shadow-[2px_2px_0_0_#1f2937] flex-shrink-0"
											>{i + 1}</span
										>
										<span class="text-gray-900 font-bold text-lg">{step}</span>
									</li>
								{/each}
							</ol>
						</div>
					</div>
				</section>
			{/if}

			<!-- FAQ Section -->
			{#if comparison.faqs && comparison.faqs.length > 0}
				<section class="mb-16">
					<h2
						class="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight"
					>
						Frequently Asked Questions
					</h2>
					<div class="space-y-4">
						{#each comparison.faqs as faq}
							<div
								class="bg-white border-[3px] border-gray-900 rounded-xl p-6 shadow-[4px_4px_0_0_#e5e7eb] hover:shadow-[2px_2px_0_0_#e5e7eb] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
							>
								<h3 class="text-lg font-black text-gray-900 mb-3 flex items-start gap-3">
									<span class="text-[#ff6b6b]">Q.</span>
									{faq.q}
								</h3>
								<p
									class="text-gray-600 font-medium leading-relaxed pl-7 border-l-[3px] border-gray-100 ml-1.5"
								>
									{faq.a}
								</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- CTA Section -->
			<section
				class="mb-16 bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#ff6b6b]"
			>
				<h2 class="text-3xl md:text-4xl font-black text-white mb-4">Try Pictify Free</h2>
				<p class="text-gray-400 font-bold mb-8 max-w-xl mx-auto">
					See why teams choose Pictify for HTML to image generation. Start in minutes, no credit
					card required.
				</p>
				<div class="flex flex-wrap justify-center gap-4">
					<a
						href="/signup"
						class="px-8 py-4 bg-[#ff6b6b] text-white border-[3px] border-white font-black uppercase tracking-wide shadow-[4px_4px_0_0_#fff] hover:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
					>
						Get Started Free
					</a>
					<a
						href="/pricing"
						class="px-8 py-4 bg-transparent text-white border-[3px] border-white font-black uppercase tracking-wide hover:bg-white hover:text-gray-900 transition-all rounded-xl"
					>
						View Pricing
					</a>
				</div>
			</section>

			<!-- Other Comparisons -->
			<section>
				<h2 class="text-xl font-black uppercase tracking-wide text-gray-400 mb-8 text-center">
					More Comparisons
				</h2>
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each otherComparisons as comp}
						{@const compSlug = comp.slug.split('-vs-')[1]}
						{@const compIcon = brandIcons[compSlug] || brandIcons.default}
						<a
							href="/compare/{comp.slug}"
							class="bg-white border-[3px] border-gray-900 p-6 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ffc480] transition-all group"
						>
							<div class="flex items-center gap-4">
								<div
									class="w-12 h-12 bg-white border-[2px] border-gray-900 rounded-xl flex items-center justify-center font-black text-gray-900 text-lg shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]"
									style="color: {compIcon.color || '#1f2937'}"
								>
									{#if compIcon.type === 'url'}
										<img src={compIcon.url} alt={comp.competitor} class="w-6 h-6" />
									{:else if compIcon.type === 'text'}
										<span class="text-sm font-black" style="color: {compIcon.color}"
											>{compIcon.text}</span
										>
									{:else if compIcon.type === 'svg'}
										<svg class="w-6 h-6" fill="currentColor" viewBox={compIcon.viewBox}>
											<path d={compIcon.path} />
										</svg>
									{:else if compIcon.type === 'fa'}
										<i class="{compIcon.class} text-xl" />
									{:else}
										<span class="text-xs font-black">{comp.competitor.charAt(0)}</span>
									{/if}
								</div>

								<div class="flex-1">
									<div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
										VS
									</div>
									<h3
										class="font-black text-gray-900 text-lg leading-none group-hover:text-gray-900"
									>
										{comp.competitor}
									</h3>
								</div>

								<div class="opacity-0 group-hover:opacity-100 transition-opacity">
									<svg
										class="w-5 h-5 text-gray-900"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M17 8l4 4m0 0l-4 4m4-4H3"
										/>
									</svg>
								</div>
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
					Comparison not found
				</h1>
				<a
					href="/compare"
					class="px-8 py-4 bg-[#ffc480] border-[3px] border-gray-900 text-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					View All Comparisons
				</a>
			</div>
		{/if}
	</main>

	<Footer />
</section>
