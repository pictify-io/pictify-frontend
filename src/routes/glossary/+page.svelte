<script>
import Nav from '$lib/components/landingPage/Nav.svelte';
import Footer from '$lib/components/landingPage/Footer.svelte';
import { glossary } from '$lib/pseo/config.js';

const title = 'Image Generation Glossary | Pictify';
const description = 'Learn about OG images, Open Graph protocol, HTML to image conversion, and other key concepts in programmatic image generation.';
const canonical = 'https://pictify.io/glossary';

// Group terms by first letter
$: groupedTerms = glossary.reduce((acc, term) => {
	const letter = term.title.charAt(0).toUpperCase();
	if (!acc[letter]) acc[letter] = [];
	acc[letter].push(term);
	return acc;
}, {});

$: letters = Object.keys(groupedTerms).sort();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="keywords" content="og image glossary, open graph terms, image generation terminology, html to image terms" />

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
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

	<main class="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-20 md:pb-32 relative z-10">
		<!-- Breadcrumb -->
		<nav class="mb-8">
			<ol class="flex items-center gap-2 text-sm font-bold">
				<li><a href="/" class="text-gray-500 hover:text-gray-900">Home</a></li>
				<li class="text-gray-400">/</li>
				<li class="text-gray-900">Glossary</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div class="relative flex flex-col items-center justify-center text-center mb-16 pt-4 sm:pt-8">
			<!-- Icon -->
			<div class="w-20 h-20 bg-[#ffc480] border-[4px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[6px_6px_0_0_#1f2937] mb-8">
				<svg class="w-10 h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</div>

			<!-- Title -->
			<h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
				Image Generation
				<span class="block text-[#ff6b6b]">Glossary</span>
			</h1>

			<!-- Description -->
			<p class="text-lg sm:text-xl text-gray-600 font-bold leading-relaxed max-w-2xl">
				Learn the key terms and concepts behind programmatic image generation, OG images, and social previews.
			</p>
		</div>

		<!-- Letter Navigation -->
		<div class="flex flex-wrap justify-center gap-2 mb-12">
			{#each letters as letter}
				<a
					href="#letter-{letter}"
					class="w-10 h-10 bg-white border-[2px] border-gray-900 rounded-lg flex items-center justify-center font-black text-gray-900 hover:bg-[#ffc480] transition-colors shadow-[2px_2px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[1px] hover:translate-y-[1px]"
				>
					{letter}
				</a>
			{/each}
		</div>

		<!-- Terms List -->
		<section class="space-y-12">
			{#each letters as letter}
				<div id="letter-{letter}">
					<h2 class="text-3xl font-black text-gray-900 mb-6 flex items-center gap-4">
						<span class="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center">
							{letter}
						</span>
					</h2>

					<div class="grid md:grid-cols-2 gap-4">
						{#each groupedTerms[letter] as term}
							<a
								href="/glossary/{term.term}"
								class="bg-white border-[3px] border-gray-900 p-6 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
							>
								<h3 class="text-xl font-black text-gray-900 mb-2 group-hover:text-[#ff6b6b] transition-colors">
									{term.title}
								</h3>
								<p class="text-gray-600 font-medium text-sm line-clamp-2">
									{term.shortDefinition}
								</p>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</section>

		<!-- Bottom CTA -->
		<section class="mt-20 bg-gray-900 border-[4px] border-gray-900 rounded-3xl p-8 md:p-12 text-center shadow-[8px_8px_0_0_#ff6b6b]">
			<h2 class="text-3xl md:text-4xl font-black text-white mb-4">
				Start Generating Images
			</h2>
			<p class="text-gray-400 font-bold mb-8 max-w-xl mx-auto">
				Put your knowledge into practice. Create OG images, social cards, and more with Pictify.
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

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
