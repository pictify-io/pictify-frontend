<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { integrations, integrationCategories } from '$lib/pseo/config.js';
	import { brandIcons } from '$lib/config/brandIcons.js';

	const title = 'Integrations | Connect Pictify to Your Stack | Pictify';
	const description =
		'Integrate Pictify with Zapier, Make, Next.js, WordPress, Shopify, and more. Generate images automatically from your favorite tools.';
	const canonical = 'https://pictify.io/integrations';

	// Group integrations by category
	$: groupedIntegrations = integrationCategories.map((cat) => ({
		...cat,
		items: integrations.filter((i) => i.category === cat.id)
	}));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="pictify integrations, zapier integration, make integration, nextjs image generation, wordpress og images, shopify product images"
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

	<main class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24 relative z-10">
		<!-- Breadcrumb -->
		<nav class="mb-12 flex justify-center">
			<ol
				class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]"
			>
				<li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
				<li class="text-gray-300">/</li>
				<li class="text-gray-900">Integrations</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div class="relative flex flex-col items-center justify-center text-center mb-24">
			<!-- Animated Icon -->
			<div class="relative mb-10 group">
				<div
					class="absolute inset-0 bg-[#ffc480] rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-300 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
				/>
				<div
					class="relative w-24 h-24 bg-white border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:-translate-y-2 transition-transform duration-300"
				>
					<svg
						class="w-12 h-12 text-gray-900"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						/>
					</svg>
				</div>
			</div>

			<!-- Title -->
			<h1
				class="text-5xl sm:text-7xl font-black text-gray-900 tracking-tighter mb-8 max-w-4xl mx-auto leading-[0.9]"
			>
				Supercharge Your <br />
				<span class="text-[#ff6b6b] decoration-clone">Workflow</span>
			</h1>

			<!-- Description -->
			<p
				class="text-xl sm:text-2xl text-gray-600 font-bold leading-relaxed max-w-2xl mx-auto mb-10"
			>
				Connect Pictify to your favorite tools. Automate image generation, sync templates, and
				stream events without writing a single line of code.
			</p>

			<!-- Quick Actions -->
			<div class="flex flex-wrap gap-4 justify-center">
				<a
					href="#browse"
					class="px-8 py-4 bg-gray-900 text-white border-[3px] border-gray-900 rounded-xl font-black uppercase tracking-wider hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-[6px_6px_0_0_#ff6b6b]"
				>
					Browse Catalog
				</a>
				<a
					href="https://docs.pictify.io"
					class="px-8 py-4 bg-white text-gray-900 border-[3px] border-gray-900 rounded-xl font-black uppercase tracking-wider hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-[6px_6px_0_0_#1f2937]"
				>
					Read Docs
				</a>
			</div>
		</div>

		<!-- Integration Categories -->
		<div id="browse" class="space-y-24">
			{#each groupedIntegrations as category}
				{#if category.items.length > 0}
					<section class="relative">
						<!-- Category Header -->
						<div
							class="flex flex-col md:flex-row md:items-end gap-6 mb-10 border-b-[3px] border-gray-900 pb-6"
						>
							<div>
								<div
									class="inline-flex items-center gap-2 px-3 py-1 bg-[#ffc480] text-gray-900 border-[2px] border-gray-900 text-xs font-black uppercase tracking-widest rounded mb-3"
								>
									{category.label}
								</div>
								<h2 class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
									{category.label} Integrations
								</h2>
							</div>
							<p class="text-gray-500 font-bold md:ml-auto md:text-right max-w-md">
								{category.description}
							</p>
						</div>

						<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
							{#each category.items as integration}
								{@const icon = brandIcons[integration.icon] || brandIcons.default}
								<a
									href="/integrations/{integration.slug}"
									class="group relative bg-white border-[3px] border-gray-900 rounded-2xl p-1 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 overflow-hidden"
								>
									<div class="p-6 h-full flex flex-col relative z-10 bg-white rounded-xl">
										<div class="flex justify-between items-start mb-6">
											<div
												class="w-16 h-16 bg-gray-50 border-[3px] border-gray-900 rounded-xl flex items-center justify-center text-3xl shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
												style="color: {icon.color || '#1f2937'}"
											>
												{#if icon.type === 'url'}
													<img src={icon.url} alt={integration.name} class="w-8 h-8" />
												{:else if icon.type === 'text'}
													<span class="text-lg font-black" style="color: {icon.color}"
														>{icon.text}</span
													>
												{:else if icon.type === 'svg'}
													<svg class="w-8 h-8" fill="currentColor" viewBox={icon.viewBox}>
														<path d={icon.path} />
													</svg>
												{:else if icon.type === 'fa'}
													<i class="{icon.class} text-3xl" />
												{:else}
													🔌
												{/if}
											</div>
											<div
												class="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0"
											>
												<svg
													class="w-6 h-6 text-gray-400 group-hover:text-gray-900"
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

										<div class="mb-4">
											<h3
												class="text-2xl font-black text-gray-900 mb-2 group-hover:text-[#ff6b6b] transition-colors"
											>
												{integration.name}
											</h3>
											<p class="text-gray-500 font-medium leading-relaxed line-clamp-2">
												{integration.description}
											</p>
										</div>

										<div
											class="mt-auto pt-4 border-t-2 border-dashed border-gray-100 flex items-center gap-2"
										>
											<span
												class="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-900 transition-colors"
											>
												Configure Integration
											</span>
										</div>
									</div>

									<!-- Hover Effect Background -->
									<div
										class="absolute inset-0 bg-[#FFFDF8] opacity-0 group-hover:opacity-100 transition-opacity z-0"
									/>
								</a>
							{/each}
						</div>
					</section>
				{/if}
			{/each}
		</div>

		<!-- Developer CTA -->
		<section class="mt-32">
			<div
				class="bg-gray-900 rounded-3xl p-1 border-[4px] border-gray-900 shadow-[12px_12px_0_0_#ff6b6b]"
			>
				<div
					class="bg-gray-900 rounded-[20px] p-8 md:p-12 border border-gray-800 overflow-hidden relative"
				>
					<!-- Code Background -->
					<div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none">
						<pre class="text-[#4ade80] font-mono text-sm leading-relaxed">
const pictify = new Pictify(API_KEY);
await pictify.render(&#123;
  template: 'marketing-v1',
  data: &#123; 
    title: 'Hello World' 
  &#125;
&#125;);</pre>
					</div>

					<div class="relative z-10 grid md:grid-cols-2 gap-12 items-center">
						<div>
							<div
								class="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 text-[#4ade80] border border-gray-700 text-xs font-mono font-bold uppercase tracking-widest rounded mb-6"
							>
								<span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
								Developers
							</div>
							<h2 class="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
								Build Custom <br />
								<span class="text-[#4ade80]">Integrations</span>
							</h2>
							<p class="text-gray-400 font-medium text-lg mb-8 max-w-md leading-relaxed">
								Use our powerful REST API and SDKs to integrate Pictify generation into any
								application, workflow, or script.
							</p>
							<div class="flex flex-wrap gap-4">
								<a
									href="https://docs.pictify.io"
									class="px-8 py-4 bg-white text-gray-900 font-black uppercase tracking-wider hover:bg-[#4ade80] hover:-translate-y-1 transition-all rounded-xl shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]"
								>
									Read Documentation
								</a>
								<a
									href="/signup"
									class="px-8 py-4 bg-transparent text-white border-[3px] border-white font-black uppercase tracking-wider hover:bg-white/10 hover:-translate-y-1 transition-all rounded-xl"
								>
									Get API Key
								</a>
							</div>
						</div>

						<!-- Interactive Code Terminal -->
						<div
							class="bg-[#0f1117] rounded-xl border-2 border-gray-800 shadow-2xl overflow-hidden font-mono text-sm group transform transition-transform hover:scale-[1.02]"
						>
							<div class="px-4 py-3 bg-[#1f2937] border-b border-gray-800 flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-[#ff6b6b]" />
								<div class="w-3 h-3 rounded-full bg-[#ffc480]" />
								<div class="w-3 h-3 rounded-full bg-[#4ade80]" />
								<div class="ml-2 text-xs text-gray-500 font-bold">bash</div>
							</div>
							<div class="p-6 space-y-4">
								<div class="flex gap-2">
									<span class="text-[#ff6b6b]">➜</span>
									<span class="text-[#4ade80]">~</span>
									<span class="text-gray-300 typing-effect"
										>curl -X POST https://api.pictify.io/image \</span
									>
								</div>
								<div class="pl-4 text-gray-400">
									-H <span class="text-[#ffc480]">'Authorization: Bearer sk_live_...'</span> \
								</div>
								<div class="pl-4 text-gray-400">
									-d <span class="text-[#ffc480]">'&#123;"template": "reciept-v2"&#125;'</span>
								</div>
								<div class="flex gap-2 text-gray-500 pt-2">
									<span>✓</span>
									<span>Generated image_28491.png in 400ms</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</main>

	<Footer />
</section>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
