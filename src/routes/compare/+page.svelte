<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { comparisons } from '$lib/pseo/config.js';
	import { brandIcons } from '$lib/config/brandIcons.js';

	const title = 'Pictify Comparisons | How Pictify Compares to Alternatives';
	const description =
		'Compare Pictify to other image generation services like Cloudinary, imgix, Placid, and self-hosted Puppeteer solutions.';
	const canonical = 'https://pictify.io/compare';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta
		name="keywords"
		content="pictify comparison, cloudinary alternative, imgix alternative, html to image comparison, image generation api comparison"
	/>

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://media.pictify.io/qyw0z-1775406908773.png" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://media.pictify.io/qyw0z-1775406908773.png" />
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
		<!-- Breadcrumb -->
		<nav class="mb-8">
			<ol class="flex items-center gap-2 text-sm font-bold">
				<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
				<li class="text-gray-400">/</li>
				<li class="text-gray-900">Compare</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div class="relative flex flex-col items-center justify-center text-center mb-16 pt-4 sm:pt-8">
			<!-- Badge -->
			<div
				class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-6"
			>
				<div
					class="px-6 py-2 bg-[#ff6b6b] border-[3px] border-gray-900 text-white font-black text-sm uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] rounded-lg"
				>
					Honest Comparisons
				</div>
			</div>

			<!-- Title -->
			<h1
				class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6"
			>
				How Pictify
				<span class="block text-[#ff6b6b]">Compares</span>
			</h1>

			<!-- Description -->
			<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed max-w-2xl">
				Honest, side-by-side comparisons to help you choose the right tool for your image generation
				needs.
			</p>
		</div>

		<!-- Comparisons Grid -->
		<section class="mb-20">
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each comparisons as comparison}
					{@const competitorSlug = comparison.slug.split('-vs-')[1]}
					{@const icon = brandIcons[competitorSlug] || brandIcons.default}

					<a
						href="/compare/{comparison.slug}"
						class="group relative bg-white border-[3px] border-gray-900 rounded-2xl p-1 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200 overflow-hidden"
					>
						<div class="p-6 h-full flex flex-col relative z-10 bg-white rounded-xl">
							<!-- VS Header -->
							<div class="flex items-center justify-between mb-8">
								<!-- Pictify Icon -->
								<div
									class="w-14 h-14 bg-gray-900 border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0_0_#ffc480]"
								>
									<svg
										class="w-8 h-8 text-white"
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

								<div class="flex flex-col items-center gap-1">
									<div class="w-1.5 h-1.5 rounded-full bg-gray-300" />
									<div class="text-xs font-black text-gray-400 uppercase tracking-widest">VS</div>
									<div class="w-1.5 h-1.5 rounded-full bg-gray-300" />
								</div>

								<!-- Competitor Icon -->
								<div
									class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center text-2xl shadow-[3px_3px_0_0_#1f2937] transition-transform group-hover:scale-110"
									style="color: {icon.color || '#1f2937'}"
								>
									{#if icon.type === 'url'}
										<img src={icon.url} alt={comparison.competitor} class="w-7 h-7" />
									{:else if icon.type === 'text'}
										<span class="text-base font-black" style="color: {icon.color}">{icon.text}</span
										>
									{:else if icon.type === 'svg'}
										<svg class="w-7 h-7" fill="currentColor" viewBox={icon.viewBox}>
											<path d={icon.path} />
										</svg>
									{:else if icon.type === 'fa'}
										<i class={icon.class} />
									{:else}
										<span class="text-xs font-bold text-gray-900">{comparison.competitor}</span>
									{/if}
								</div>
							</div>

							<div class="mb-4">
								<h2
									class="text-2xl font-black text-gray-900 mb-2 group-hover:text-[#ff6b6b] transition-colors leading-tight"
								>
									Pictify vs <br />{comparison.competitor}
								</h2>
								<div class="h-1 w-12 bg-[#ff6b6b] mb-4" />
								<p class="text-gray-500 font-medium leading-relaxed line-clamp-3 mb-6">
									{comparison.tldr}
								</p>
							</div>

							<div class="mt-auto pt-4 border-t-2 border-dashed border-gray-100">
								<span
									class="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 group-hover:gap-3 transition-all"
								>
									Compare Features
									<svg
										class="w-4 h-4 text-[#ff6b6b]"
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
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<!-- Bottom CTA -->
		<section
			class="bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#ff6b6b]"
		>
			<h2 class="text-3xl md:text-4xl font-black text-white mb-4">Ready to try Pictify?</h2>
			<p class="text-gray-400 font-bold mb-8 max-w-xl mx-auto">
				Start generating images in minutes with our free tier. No credit card required.
			</p>
			<a
				href="/signup"
				class="inline-block px-8 py-4 bg-[#ff6b6b] text-white border-[3px] border-white font-black uppercase tracking-wide shadow-[4px_4px_0_0_#fff] hover:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
			>
				Get Started Free
			</a>
		</section>
	</main>

	<Footer />
</section>
