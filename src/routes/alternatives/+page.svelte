<script>
import Nav from '$lib/components/landingPage/Nav.svelte';
import Footer from '$lib/components/landingPage/Footer.svelte';
import { alternatives } from '$lib/pseo/comparisons.js';

const title = 'Pictify Alternatives | Switch to Better Image Generation';
const description = 'Looking for an alternative to Cloudinary, Puppeteer, or other image tools? See how Pictify compares and why teams are switching.';
const canonical = 'https://pictify.io/alternatives';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="keywords" content="pictify alternative, cloudinary alternative, puppeteer alternative, html to image alternative, image generation api" />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-hidden font-['Manrope']">
	<Nav />

	<!-- Background Elements -->
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#4ade80]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

	<main class="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10">
		<!-- Breadcrumb -->
		<nav class="mb-8">
			<ol class="flex items-center gap-2 text-sm font-bold">
				<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
				<li class="text-gray-400">/</li>
				<li class="text-gray-900">Alternatives</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div class="relative flex flex-col items-center justify-center text-center mb-16 pt-4 sm:pt-8">
			<!-- Badge -->
			<div class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-6">
				<div class="px-6 py-2 bg-[#4ade80] border-[3px] border-gray-900 text-gray-900 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] rounded-lg">
					Switch to Better
				</div>
			</div>

			<!-- Title -->
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
				Pictify as Your
				<span class="block text-[#4ade80]">Alternative</span>
			</h1>

			<!-- Description -->
			<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed max-w-2xl">
				Looking to switch from your current image generation tool? See how Pictify compares and why teams are making the move.
			</p>
		</div>

		<!-- Why Teams Switch Section -->
		<section class="mb-16">
			<div class="bg-white border-[3px] border-gray-900 rounded-2xl p-8 shadow-[6px_6px_0_0_#1f2937]">
				<h2 class="text-2xl font-black text-gray-900 mb-6 text-center">Why Teams Switch to Pictify</h2>
				<div class="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
					<div class="text-center">
						<div class="w-12 h-12 bg-[#4ade80] border-[2px] border-gray-900 rounded-xl mx-auto mb-3 flex items-center justify-center">
							<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<h3 class="font-black text-gray-900 mb-1">Faster Setup</h3>
						<p class="text-sm text-gray-600 font-medium">Generate images in minutes, not days</p>
					</div>
					<div class="text-center">
						<div class="w-12 h-12 bg-[#ffc480] border-[2px] border-gray-900 rounded-xl mx-auto mb-3 flex items-center justify-center">
							<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 class="font-black text-gray-900 mb-1">Better Pricing</h3>
						<p class="text-sm text-gray-600 font-medium">Simple, affordable per-image pricing</p>
					</div>
					<div class="text-center">
						<div class="w-12 h-12 bg-[#ff6b6b] border-[2px] border-gray-900 rounded-xl mx-auto mb-3 flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
							</svg>
						</div>
						<h3 class="font-black text-gray-900 mb-1">Full HTML Control</h3>
						<p class="text-sm text-gray-600 font-medium">Use any HTML/CSS for unlimited designs</p>
					</div>
					<div class="text-center">
						<div class="w-12 h-12 bg-gray-900 border-[2px] border-gray-900 rounded-xl mx-auto mb-3 flex items-center justify-center">
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
						</div>
						<h3 class="font-black text-gray-900 mb-1">No Infrastructure</h3>
						<p class="text-sm text-gray-600 font-medium">We handle browsers, scaling, and CDN</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Alternatives Grid -->
		<section class="mb-16">
			<h2 class="text-2xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight">
				Explore Alternatives
			</h2>
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each alternatives as alt}
					<a
						href="/alternatives/{alt.slug}"
						class="bg-white border-[3px] border-gray-900 p-6 rounded-2xl shadow-[5px_5px_0_0_#4ade80] hover:shadow-[3px_3px_0_0_#4ade80] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
					>
						<div class="flex items-center gap-3 mb-4">
							<div class="w-10 h-10 bg-gray-100 border-[2px] border-gray-300 rounded-lg flex items-center justify-center font-black text-gray-600 text-sm">
								{alt.competitor.charAt(0)}
							</div>
							<h3 class="text-lg font-black text-gray-900 group-hover:text-[#4ade80] transition-colors">
								{alt.competitor} Alternative
							</h3>
						</div>
						<p class="text-gray-600 font-medium text-sm mb-4 line-clamp-2">
							{alt.metaDescription}
						</p>
						<span class="text-sm font-bold text-[#4ade80] uppercase tracking-wide flex items-center gap-2">
							Compare
							<svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
							</svg>
						</span>
					</a>
				{/each}
			</div>
		</section>

		<!-- Also See Section -->
		<section class="mb-16">
			<div class="text-center mb-8">
				<h2 class="text-xl font-black text-gray-400 uppercase tracking-wide">Also See</h2>
			</div>
			<div class="flex flex-wrap justify-center gap-4">
				<a href="/compare" class="px-6 py-3 bg-white border-[3px] border-gray-900 rounded-xl font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
					All Comparisons
				</a>
				<a href="/pricing" class="px-6 py-3 bg-white border-[3px] border-gray-900 rounded-xl font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
					Pricing
				</a>
				<a href="/tools" class="px-6 py-3 bg-white border-[3px] border-gray-900 rounded-xl font-bold text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
					Free Tools
				</a>
			</div>
		</section>

		<!-- Bottom CTA -->
		<section class="bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#4ade80]">
			<h2 class="text-3xl md:text-4xl font-black text-white mb-4">
				Ready to Switch?
			</h2>
			<p class="text-gray-400 font-bold mb-8 max-w-xl mx-auto">
				Start generating images in minutes. Free tier available, no credit card required.
			</p>
			<a
				href="/signup"
				class="inline-block px-8 py-4 bg-[#4ade80] text-gray-900 border-[3px] border-white font-black uppercase tracking-wide shadow-[4px_4px_0_0_#fff] hover:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl"
			>
				Get Started Free
			</a>
		</section>
	</main>

	<Footer />
</section>
