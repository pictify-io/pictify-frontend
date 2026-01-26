<script>
import Nav from '$lib/components/landingPage/Nav.svelte';
import Footer from '$lib/components/landingPage/Footer.svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { integrations, integrationCategories } from '$lib/pseo/config.js';
import { brandIcons } from '$lib/config/brandIcons.js';

$: slug = $page.params.slug;
$: integration = integrations.find(i => i.slug === slug);
$: validIntegration = !!integration;
$: category = integration ? integrationCategories.find(c => c.id === integration.category) : null;
$: icon = validIntegration ? (brandIcons[integration.icon] || brandIcons.default) : brandIcons.default;
// Redirect if not found
$: if (browser && !validIntegration && slug) {
	goto('/integrations');
}

// Related integrations (same category)
$: relatedIntegrations = integration
	? integrations.filter(i => i.category === integration.category && i.slug !== slug).slice(0, 3)
	: [];

// SEO
$: title = validIntegration
	? `${integration.name} Integration | Pictify`
	: 'Integration | Pictify';
$: description = validIntegration
	? integration.description
	: 'Integrate Pictify with your tools.';
$: canonical = validIntegration
	? `https://pictify.io/integrations/${slug}`
	: 'https://pictify.io/integrations';

// Structured data
$: structuredData = validIntegration ? {
	'@context': 'https://schema.org',
	'@type': 'SoftwareApplication',
	name: `Pictify ${integration.name} Integration`,
	description: integration.longDescription,
	url: canonical,
	applicationCategory: 'DesignApplication',
	offers: {
		'@type': 'Offer',
		price: '0',
		priceCurrency: 'USD'
	}
} : null;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="keywords" content="{integration?.name} pictify, {integration?.name} image generation, {integration?.name} og images" />

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
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

	<main class="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-24 relative z-10">
		{#if validIntegration}
			<!-- Breadcrumb -->
			<nav class="mb-12 flex justify-center">
				<ol class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]">
					<li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
					<li class="text-gray-300">/</li>
					<li><a href="/integrations" class="text-gray-500 hover:text-gray-900 transition-colors">Integrations</a></li>
					<li class="text-gray-300">/</li>
					<li class="text-gray-900">{integration.name}</li>
				</ol>
			</nav>

			<!-- Hero Section -->
			<div class="relative flex flex-col items-center justify-center text-center mb-20 pt-4">
				<!-- Animated Icon Pair -->
				<div class="flex items-center gap-6 mb-10">
					<!-- Integration Icon -->
					<div class="relative group">
						<div class="absolute inset-0 bg-[#ffc480] rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-300 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"></div>
						<div class="relative w-20 h-20 bg-white border-[3px] border-gray-900 rounded-2xl flex items-center justify-center text-4xl shadow-[4px_4px_0_0_#1f2937] group-hover:-translate-y-2 transition-transform duration-300" style="color: {icon.color || '#1f2937'}">
						{#if icon.type === 'url'}
							<img src={icon.url} alt={integration.name} class="w-10 h-10" />
						{:else if icon.type === 'text'}
							<span class="text-2xl font-black" style="color: {icon.color}">{icon.text}</span>
						{:else if icon.type === 'svg'}
							<svg class="w-10 h-10" fill="currentColor" viewBox={icon.viewBox}>
								<path d={icon.path} />
							</svg>
						{:else if icon.type === 'fa'}
							<i class="{icon.class} text-5xl"></i>
						{:else}
							🔌
						{/if}
						</div>
					</div>
					
					<!-- Connector -->
					<div class="flex flex-col items-center gap-1">
						<div class="w-2 h-2 rounded-full bg-gray-900"></div>
						<div class="w-2 h-2 rounded-full bg-gray-300"></div>
						<div class="w-2 h-2 rounded-full bg-gray-900"></div>
					</div>

					<!-- Pictify Icon -->
					<div class="relative group">
						<div class="absolute inset-0 bg-[#ffc480] rounded-2xl -rotate-6 group-hover:-rotate-12 transition-transform duration-300 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"></div>
						<div class="relative w-20 h-20 bg-gray-900 border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#ffc480] group-hover:-translate-y-2 transition-transform duration-300">
							<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
					</div>
				</div>

				<!-- Title -->
				<h1 class="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tighter mb-8 leading-[0.9]">
					{integration.name} <br/>
					<span class="text-[#ff6b6b]">+ Pictify</span>
				</h1>

				<!-- Description -->
				<p class="text-xl text-gray-600 font-bold leading-relaxed max-w-2xl mx-auto mb-8">
					{integration.description}
				</p>

				<!-- Category Badge -->
				<div class="inline-flex">
					<span class="px-4 py-1 bg-white border-[3px] border-gray-900 rounded-full text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937]">
						{category?.label || 'Integration'}
					</span>
				</div>
			</div>

			<!-- Long Description -->
			<section class="mb-20">
				<div class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 md:p-12 shadow-[8px_8px_0_0_#1f2937] relative overflow-hidden">
					<div class="absolute top-0 left-0 w-full h-3 bg-[#ffc480] border-b-[3px] border-gray-900"></div>
					<h3 class="text-2xl font-black text-gray-900 mb-6">About Integration</h3>
					<p class="text-xl text-gray-600 font-medium leading-relaxed">
						{integration.longDescription}
					</p>
				</div>
			</section>

			<!-- Features Grid -->
			{#if integration.features?.length}
				<section class="mb-20">
					<div class="flex items-center gap-4 mb-10">
						<h2 class="text-3xl font-black uppercase tracking-tighter text-gray-900">
							Key Capabilities
						</h2>
						<div class="flex-1 h-[3px] bg-gray-900 border-b-[3px] border-dashed border-gray-300"></div>
					</div>
					
					<div class="grid sm:grid-cols-2 gap-6">
						{#each integration.features as feature}
							<div class="bg-white border-[3px] border-gray-900 p-6 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#1f2937] transition-all">
								<div class="flex items-start gap-4">
									<div class="w-10 h-10 bg-[#4ade80] border-[3px] border-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
										<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
										</svg>
									</div>
									<p class="text-gray-800 font-bold text-lg pt-1">{feature}</p>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Use Cases -->
			{#if integration.useCases?.length}
				<section class="mb-20">
					<div class="bg-[#ffc480] border-[3px] border-gray-900 rounded-3xl p-1 shadow-[8px_8px_0_0_#1f2937]">
						<div class="bg-[#FFFDF8] rounded-[20px] p-8 md:p-12 border border-[#b45309]">
							<h2 class="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-8">
								Common Use Cases
							</h2>
							<div class="grid gap-6">
								{#each integration.useCases as useCase}
									<div class="flex items-start gap-4">
										<div class="w-8 h-8 rounded-full bg-[#ffc480] border-[3px] border-gray-900 flex items-center justify-center flex-shrink-0 font-black text-xs">
											<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
										</div>
										<p class="text-gray-900 font-bold text-xl">{useCase}</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</section>
			{/if}

			<!-- Tutorial Section -->
			{#if integration.tutorial}
				<section class="mb-20 relative" id="tutorial">
					<div class="absolute inset-0 bg-gray-100 -skew-y-2 scale-x-125 -z-10 opacity-50"></div>
					
					<!-- Tutorial Header -->
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
						<h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-gray-900">
							Integration Guide
						</h2>
						{#if integration.tutorial.estimatedTime}
							<div class="inline-flex items-center gap-2 px-6 py-2 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937]">
								<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span class="text-base font-black text-gray-900">{integration.tutorial.estimatedTime}</span>
							</div>
						{/if}
					</div>

					<!-- Tutorial Card -->
					<div class="space-y-12">
						<!-- Prerequisites -->
						{#if integration.tutorial.prerequisites?.length}
							<div class="bg-[#e0f7fa] border-[3px] border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_0_#1f2937]">
								<h4 class="text-lg font-black uppercase tracking-wide text-cyan-900 mb-4 bg-cyan-200 inline-block px-2 py-1 rounded border-2 border-cyan-800">Prerequisites</h4>
								<ul class="space-y-3">
									{#each integration.tutorial.prerequisites as prereq}
										<li class="flex items-start gap-3">
											<div class="w-6 h-6 bg-white border-[2px] border-gray-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
												<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
												</svg>
											</div>
											<span class="text-gray-900 font-bold text-lg">{prereq}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
						
						{#each integration.tutorial.steps as step, i}
							<div class="bg-white border-[3px] border-gray-900 rounded-2xl overflow-hidden shadow-[8px_8px_0_0_#1f2937]">
								<!-- Step Header -->
								<div class="border-b-[3px] border-gray-900 bg-gray-50 p-6 sm:p-8 flex items-center gap-6">
									<div class="w-12 h-12 bg-[#ff6b6b] border-[3px] border-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#1f2937]">
										<span class="text-white font-black text-xl">{i + 1}</span>
									</div>
									<h4 class="text-2xl font-black text-gray-900">{step.title}</h4>
								</div>

								<div class="p-6 sm:p-8">
									<p class="text-gray-600 font-medium text-lg leading-relaxed mb-6">{step.description}</p>
									
									<!-- Code Block -->
									{#if step.code}
										<div class="mb-6">
											<div class="bg-gray-900 rounded-xl overflow-hidden border-[3px] border-gray-900">
												<div class="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
													<span class="text-xs font-bold text-gray-400 uppercase tracking-wide">Code</span>
													<button
														class="text-xs font-bold text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
														on:click={() => navigator.clipboard.writeText(step.code)}
													>
														Copy
													</button>
												</div>
												<pre class="p-4 overflow-x-auto text-sm"><code class="text-gray-300 font-mono whitespace-pre">{step.code}</code></pre>
											</div>
										</div>
									{/if}

									<!-- Tip -->
									{#if step.tip}
										<div class="flex items-start gap-4 p-4 bg-[#ffc480]/20 border-[2px] border-[#ffc480] rounded-xl">
											<div class="w-8 h-8 bg-[#ffc480] border-[2px] border-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
												<span class="text-base font-black text-gray-900">!</span>
											</div>
											<p class="text-gray-800 font-bold text-base pt-0.5">{step.tip}</p>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Install Command (for SDKs) -->
			{#if integration.installCommand}
				<section class="mb-20">
					<div class="bg-gray-900 rounded-3xl p-8 md:p-12 text-center border-[4px] border-gray-900 shadow-[8px_8px_0_0_#4ade80]">
						<h2 class="text-3xl font-black uppercase tracking-tight text-white mb-8">
							Fast Install
						</h2>
						<div class="inline-flex items-center gap-4 bg-black border border-gray-700 rounded-xl p-6 font-mono text-lg text-[#4ade80] max-w-2xl mx-auto shadow-2xl">
							<span class="text-[#ff6b6b]">$</span>
							{integration.installCommand}
							<button 
								class="ml-4 p-2 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
								on:click={() => navigator.clipboard.writeText(integration.installCommand)}
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
							</button>
						</div>
					</div>
				</section>
			{/if}

			<!-- CTA Section -->
			<section class="mb-20 bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-10 md:p-16 text-center shadow-[12px_12px_0_0_#ff6b6b] relative overflow-hidden">
				<!-- Abstract Shapes -->
				<div class="absolute top-0 left-0 w-32 h-32 bg-[#ff6b6b] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
				<div class="absolute bottom-0 right-0 w-32 h-32 bg-[#4ade80] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

				<div class="relative z-10">
					<h2 class="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
						Ready to build with {integration.name}?
					</h2>
					<p class="text-gray-400 font-bold text-xl mb-10 max-w-xl mx-auto leading-relaxed">
						Get your API key in seconds and start generating images programmatically.
					</p>
					<div class="flex flex-wrap justify-center gap-6">
						{#if integration.docsUrl}
							<a
								href={integration.docsUrl}
								target="_blank"
								rel="noopener"
								class="px-8 py-4 bg-white text-gray-900 border-[3px] border-white font-black uppercase tracking-wide hover:bg-[#ffc480] hover:-translate-y-1 transition-all rounded-xl shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]"
							>
								View Documentation
							</a>
						{/if}
						<a
							href="/signup"
							class="px-8 py-4 bg-[#ff6b6b] text-white border-[3px] border-[#ff6b6b] font-black uppercase tracking-wide hover:bg-[#ff5252] hover:-translate-y-1 transition-all rounded-xl shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]"
						>
							Start For Free
						</a>
					</div>
				</div>
			</section>

			<!-- Related Integrations -->
			{#if relatedIntegrations.length > 0}
				<section>
					<div class="flex items-center gap-4 mb-8">
						<h2 class="text-xl font-black uppercase tracking-wide text-gray-400">
							Related Integrations
						</h2>
						<div class="flex-1 h-[2px] bg-gray-200"></div>
					</div>
					<div class="grid sm:grid-cols-3 gap-6">
						{#each relatedIntegrations as related}
						{@const relatedIcon = brandIcons[related.icon] || brandIcons.default}
							<a
								href="/integrations/{related.slug}"
								class="bg-white border-[3px] border-gray-900 p-6 rounded-2xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ffc480] transition-all group"
							>
								<div class="flex items-center gap-4">
									<div class="w-12 h-12 bg-gray-100 group-hover:bg-white border-[2px] border-gray-900 rounded-xl flex items-center justify-center text-2xl transition-colors" style="color: {relatedIcon.color || '#1f2937'}">
							{#if relatedIcon.type === 'url'}
								<img src={relatedIcon.url} alt={related.name} class="w-6 h-6" />
							{:else if relatedIcon.type === 'text'}
								<span class="text-sm font-black" style="color: {relatedIcon.color}">{relatedIcon.text}</span>
							{:else if relatedIcon.type === 'svg'}
								<svg class="w-6 h-6" fill="currentColor" viewBox={relatedIcon.viewBox}>
									<path d={relatedIcon.path} />
								</svg>
							{:else if relatedIcon.type === 'fa'}
								<i class="{relatedIcon.class} text-2xl"></i>
							{:else}
								🔌
							{/if}
									</div>
									<span class="font-black text-gray-900 text-lg">{related.name}</span>
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}

		{:else}
			<!-- Not Found State -->
			<div class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-8 px-4">
				<div class="w-32 h-32 bg-[#ff6b6b] rounded-full border-[4px] border-gray-900 flex items-center justify-center text-6xl font-black text-white shadow-[8px_8px_0_0_#1f2937]">?</div>
				<h1 class="text-5xl md:text-7xl font-black uppercase tracking-tighter text-gray-900">Integration not found</h1>
				<p class="text-xl text-gray-500 font-bold max-w-md">We couldn't find the integration you're looking for.</p>
				<a
					href="/integrations"
					class="px-10 py-5 bg-[#ffc480] border-[3px] border-gray-900 text-gray-900 font-black uppercase tracking-wider shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-xl"
				>
					Browse Integrations
				</a>
			</div>
		{/if}
	</main>

	<Footer />
</section>
