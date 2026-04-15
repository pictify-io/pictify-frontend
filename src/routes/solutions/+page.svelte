<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { solutions, getPillar } from '$lib/solutions/related.js';

	const pillar = getPillar();
	const others = solutions.filter((s) => !s.isPillar);

	const title = 'Solutions — Programmable Image Generation Use Cases | Pictify';
	const description =
		'Every way teams automate image generation with Pictify — from OG images to personalized email headers, product catalogs, and bulk rendering.';
	const canonical = 'https://pictify.io/solutions';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
</svelte:head>

<div class="min-h-screen bg-[#FFFDF8]">
	<Nav />

	<main class="max-w-6xl mx-auto px-4 py-20">
		<nav class="mb-8 flex justify-center">
			<ol class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]">
				<li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
				<li class="text-gray-300">/</li>
				<li class="text-gray-900">Solutions</li>
			</ol>
		</nav>

		<header class="text-center mb-16">
			<h1 class="text-5xl md:text-6xl font-black text-gray-900 leading-[0.95] mb-6">
				Every way teams<br />
				<span class="text-[#ff6b6b]">automate images.</span>
			</h1>
			<p class="text-xl text-gray-700 font-medium max-w-2xl mx-auto">
				One API. Eleven use cases. Real expression engine, live data bindings, and A/B experiments built in.
			</p>
		</header>

		{#if pillar}
			<a
				href="/solutions/{pillar.slug}"
				class="block mb-12 bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0_0_#ffc480] hover:shadow-[12px_12px_0_0_#ffc480] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
			>
				<div class="bg-[#ffc480] px-6 py-2 border-b-[3px] border-gray-900">
					<span class="text-xs font-black uppercase tracking-widest text-gray-900">Start here</span>
				</div>
				<div class="p-8">
					<h2 class="text-3xl md:text-4xl font-black text-gray-900 mb-3">{pillar.label}</h2>
					<p class="text-lg text-gray-700 font-medium">{pillar.summary}</p>
					<div class="mt-4 text-sm font-black uppercase tracking-widest text-gray-500 inline-flex items-center gap-1.5">
						Read the guide
						<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</div>
				</div>
			</a>
		{/if}

		<h2 class="text-2xl md:text-3xl font-black uppercase tracking-wider text-gray-400 mb-6">
			Use-case guides
		</h2>
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each others as s, i}
				{@const colors = ['bg-[#ff6b6b]', 'bg-[#4ade80]', 'bg-[#ffc480]', 'bg-[#a78bfa]', 'bg-[#06b6d4]', 'bg-[#ec4899]']}
				<a
					href="/solutions/{s.slug}"
					class="group bg-white border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_0_#1f2937] hover:shadow-[10px_10px_0_0_#1f2937] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
				>
					<div class="{colors[i % colors.length]} h-2 border-b-[3px] border-gray-900"></div>
					<div class="p-6">
						<h3 class="font-black text-gray-900 mb-2 text-lg leading-tight group-hover:text-[#ff6b6b] transition-colors">
							{s.label}
						</h3>
						<p class="text-sm text-gray-600 leading-relaxed mb-4">{s.summary}</p>
						<div class="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors inline-flex items-center gap-1.5">
							Read the guide
							<svg class="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</main>

	<Footer />
</div>
